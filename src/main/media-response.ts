import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
export async function mediaResponse(path: string, request: Request): Promise<Response> {
  const { size } = await stat(path);
  const headers = new Headers({
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Content-Length": String(size),
    "Cache-Control": "no-store",
  });
  if (request.method !== "GET" && request.method !== "HEAD")
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  let start = 0;
  let end = size - 1;
  let status = 200;
  const range = request.headers.get("range");
  if (range && request.method === "GET") {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const first = match?.[1];
    const last = match?.[2];
    if (!match || (!first && !last))
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    if (first) {
      start = Number(first);
      end = last ? Math.min(Number(last), size - 1) : size - 1;
    } else {
      const suffix = Number(last);
      start = Math.max(0, size - suffix);
    }
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      start >= size ||
      end < start
    )
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    status = 206;
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
  }
  if (request.method === "HEAD" || size === 0) return new Response(null, { status, headers });
  const source = createReadStream(path, { start, end });
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      source.on("data", (chunk) => {
        if (Buffer.isBuffer(chunk)) {
          controller.enqueue(new Uint8Array(chunk));
          if ((controller.desiredSize ?? 0) <= 0) source.pause();
        }
      });
      source.once("end", () => controller.close());
      source.once("error", (error) => controller.error(error));
    },
    pull() {
      source.resume();
    },
    cancel() {
      source.destroy();
    },
  });
  return new Response(body, { status, headers });
}
