export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Only raster images are served from public/uploads; never trust a client filename or MIME type. */
export function imageExtension(bytes: Uint8Array): string | null {
  const buffer = Buffer.from(bytes);
  if (buffer.length > MAX_UPLOAD_BYTES) return null;
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && buffer.toString("ascii", 12, 16) === "IHDR") return ".png";
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return ".jpg";
  if (buffer.length >= 13 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) return ".gif";
  if (buffer.length >= 16 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return ".webp";
  return null;
}
