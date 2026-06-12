import imageCompression from "browser-image-compression";

const MAX_SIZE_MB = 2;

export async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_SIZE_MB * 1024 * 1024 && file.type === "image/webp") {
    return file;
  }

  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 512,
    useWebWorker: true,
    fileType: "image/webp",
  });
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
