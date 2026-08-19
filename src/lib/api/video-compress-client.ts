"use client";

/**
 * Best-effort, in-browser video re-encode before a reel upload — caps
 * resolution/bitrate so playback doesn't stall on a large, unoptimized
 * phone-camera file (ReelViewer's windowed preload helps once it's playing,
 * but can't fix a genuinely huge source file). Skips clips that are already
 * small, and — since this only ever trades upload/playback speed, never
 * correctness — falls back to the original file for anything too large to
 * safely transcode in-browser, or if compression fails for any reason.
 */
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const CORE_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
const MIN_COMPRESS_BYTES = 6 * 1024 * 1024; // already small — not worth the CPU cost
const MAX_COMPRESS_BYTES = 150 * 1024 * 1024; // too large to safely transcode in-browser

let ffmpegPromise: Promise<FFmpeg> | null = null;

function loadFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

export interface CompressOptions {
  /** 0–1 progress, reported while ffmpeg is encoding. */
  onProgress?: (ratio: number) => void;
}

export async function compressReelVideo(
  file: File,
  { onProgress }: CompressOptions = {},
): Promise<File> {
  if (file.size < MIN_COMPRESS_BYTES || file.size > MAX_COMPRESS_BYTES) {
    return file;
  }

  try {
    const ffmpeg = await loadFFmpeg();

    const progressHandler = ({ progress }: { progress: number }) =>
      onProgress?.(Math.min(1, Math.max(0, progress)));
    if (onProgress) ffmpeg.on("progress", progressHandler);

    const inputName = "input" + (file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".mp4");
    const outputName = "output.mp4";

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Cap the long side at 1280px, re-encode H.264/AAC at a moderate CRF,
      // and move the moov atom to the front (+faststart) so playback can
      // start before the whole file downloads.
      await ffmpeg.exec([
        "-i",
        inputName,
        "-vf",
        "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-movflags",
        "+faststart",
        outputName,
      ]);

      const bytes = (await ffmpeg.readFile(outputName)) as Uint8Array;
      // .slice() copies into a plain (non-shared) ArrayBuffer, satisfying
      // BlobPart's stricter type than the SDK's ArrayBufferLike return.
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([buffer], { type: "video/mp4" });

      // Only use the result if it actually helped.
      if (blob.size >= file.size) return file;

      const compressedName = file.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".mp4";
      return new File([blob], compressedName, { type: "video/mp4" });
    } finally {
      if (onProgress) ffmpeg.off("progress", progressHandler);
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
  } catch {
    // Compression is an optimization, not a requirement — upload the
    // original rather than blocking the contributor.
    return file;
  }
}
