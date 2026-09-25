import { rename, rm } from "node:fs/promises";
import { z } from "zod";
import { AppError } from "../shared/contracts";
import { runMedia } from "./media-process";

const TARGET = "I=-16:TP=-1.5:LRA=11";
const measurementSchema = z.object({
  input_i: z.string(),
  input_tp: z.string(),
  input_lra: z.string(),
  input_thresh: z.string(),
  target_offset: z.string(),
});
function filterFor(log: string): string {
  const json = log.match(/\{\s*"input_i"[^}]+\}/u)?.[0];
  if (!json) throw new AppError("MEDIA_NORMALIZE", "영상의 음량을 측정하지 못했습니다.");
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new AppError("MEDIA_NORMALIZE", "영상의 음량 정보를 읽지 못했습니다.");
    throw error;
  }
  const parsed = measurementSchema.safeParse(data);
  if (!parsed.success) throw new AppError("MEDIA_NORMALIZE", "영상의 음량 정보를 읽지 못했습니다.");
  const values = Object.values(parsed.data).map(Number);
  if (values.some((value) => !Number.isFinite(value))) return "anull";
  const measured = parsed.data;
  return `loudnorm=${TARGET}:measured_I=${Number(measured.input_i)}:measured_TP=${Number(measured.input_tp)}:measured_LRA=${Number(measured.input_lra)}:measured_thresh=${Number(measured.input_thresh)}:offset=${Number(measured.target_offset)}:linear=true`;
}
export async function normalizeMedia(
  options: Readonly<{ executable: string; input: string; output: string; signal: AbortSignal }>,
): Promise<void> {
  const { executable, input, output, signal } = options;
  const temporary = `${output}.normalizing.mp4`;
  try {
    const log = await runMedia(
      executable,
      [
        "-hide_banner",
        "-nostdin",
        "-nostats",
        "-i",
        input,
        "-map",
        "0:a:0",
        "-af",
        `loudnorm=${TARGET}:print_format=json`,
        "-f",
        "null",
        "-",
      ],
      signal,
      { timeout: 15 * 60 * 1000, capture: "stderr" },
    );
    await runMedia(
      executable,
      [
        "-hide_banner",
        "-nostdin",
        "-nostats",
        "-y",
        "-i",
        input,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0",
        "-c:v",
        "copy",
        "-af",
        filterFor(log),
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        "48000",
        "-movflags",
        "+faststart",
        temporary,
      ],
      signal,
      15 * 60 * 1000,
    );
    if (signal.aborted) throw new AppError("MEDIA_CANCELLED", "미디어 준비를 취소했습니다.");
    await rename(temporary, output);
  } catch (error) {
    await rm(temporary, { force: true });
    if (error instanceof AppError) throw error;
    throw new AppError(
      "MEDIA_NORMALIZE",
      "영상의 음량을 조절하지 못했습니다. 저장 공간을 확인해 주세요.",
    );
  }
}
