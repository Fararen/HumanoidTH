import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "node:crypto";
import path from "path";
import { getSessionUser } from "@/lib/session";
import { imageExtension, MAX_UPLOAD_BYTES } from "@/lib/upload-policy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.id.startsWith("demo:")) {
      return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
    }
    if (Number(request.headers.get("content-length")) > MAX_UPLOAD_BYTES + 65536) {
      return NextResponse.json({ success: false, error: "Image must be 5 MB or smaller" }, { status: 413 });
    }
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ success: false, error: "Image must be 5 MB or smaller" }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = imageExtension(buffer);
    if (!ext) return NextResponse.json({ success: false, error: "Upload a PNG, JPEG, GIF or WebP image" }, { status: 415 });
    const filename = `${randomUUID()}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer, { flag: "wx" });

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload file" }, { status: 500 });
  }
}
