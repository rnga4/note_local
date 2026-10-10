const MAX_DIM = 1280;
const QUALITY = 0.82;

// Downscale in the browser so a pasted screenshot does not bloat the database or backups.
export async function fileToDataUrl(file: File): Promise<string> {
  const raw = await readAsDataUrl(file);
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return raw;
  }
  try {
    return await downscale(raw);
  } catch {
    return raw;
  }
}

export async function collectImages(files: Iterable<File>): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;
    out.push(await fileToDataUrl(f));
  }
  return out;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function downscale(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no 2d context"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", QUALITY));
    };
    img.onerror = () => reject(new Error("bad image"));
    img.src = src;
  });
}
