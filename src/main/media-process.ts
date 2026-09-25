import { spawn } from "node:child_process";
import { join } from "node:path";
import { AppError } from "../shared/contracts";
export function runMedia(
  executable: string,
  args: readonly string[],
  signal: AbortSignal,
  timeout: number | Readonly<{ timeout: number; capture: "stderr" }>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new AppError("MEDIA_CANCELLED", "미디어 준비를 취소했습니다."));
      return;
    }
    const child = spawn(executable, [...args], {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let stopped: AppError | undefined;
    const stop = (error: AppError) => {
      if (stopped) return;
      stopped = error;
      if (process.platform === "win32" && child.pid) {
        const killer = spawn(
          join(process.env["SystemRoot"] ?? "C:\\Windows", "System32", "taskkill.exe"),
          ["/PID", String(child.pid), "/T", "/F"],
          { shell: false, windowsHide: true, stdio: "ignore" },
        );
        killer.once("error", () => child.kill());
        killer.once("close", () => child.kill());
      } else child.kill("SIGKILL");
    };
    const abort = () => stop(new AppError("MEDIA_CANCELLED", "미디어 준비를 취소했습니다."));
    const timer = setTimeout(
      () =>
        stop(
          new AppError("MEDIA_TIMEOUT", "미디어 준비 시간이 초과되었습니다. 다시 시도해 주세요."),
        ),
      typeof timeout === "number" ? timeout : timeout.timeout,
    );
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
    };
    signal.addEventListener("abort", abort, { once: true });
    const captured = typeof timeout === "number" ? child.stdout : child.stderr;
    const ignored = typeof timeout === "number" ? child.stderr : child.stdout;
    captured.setEncoding("utf8");
    captured.on("data", (chunk: string) => {
      if (output.length + chunk.length > 4 * 1024 * 1024)
        stop(new AppError("MEDIA_OUTPUT", "미디어 정보가 허용 크기를 초과했습니다."));
      else output += chunk;
    });
    ignored.resume();
    child.once("error", () => {
      cleanup();
      reject(
        stopped ??
          new AppError(
            "MEDIA_TOOL",
            "미디어 도구를 실행하지 못했습니다. 프로그램을 다시 설치해 주세요.",
          ),
      );
    });
    child.once("close", (code: number | null) => {
      cleanup();
      if (stopped) reject(stopped);
      else if (code !== 0)
        reject(
          new AppError(
            "MEDIA_DOWNLOAD",
            "영상을 가져오지 못했습니다. 공개 영상인지와 인터넷 연결을 확인해 주세요.",
          ),
        );
      else resolve(output);
    });
    if (signal.aborted) abort();
  });
}
