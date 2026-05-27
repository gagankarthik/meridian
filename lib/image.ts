/**
 * Client-side image helpers. Logos are displayed small, so we downscale to a
 * compact square before storing — this keeps a data-URL fallback well under
 * DynamoDB's 400KB item limit and shrinks the S3 object when one is used.
 */

/** Read a File into a data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Downscale an image File to at most `max` px on its longest side and return a
 * compact data URL (WebP when supported, else JPEG). Falls back to the raw
 * data URL if the canvas pipeline is unavailable.
 */
export async function downscaleImage(file: File, max = 256): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  if (typeof document === "undefined") return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    const webp = canvas.toDataURL("image/webp", 0.85);
    // Some browsers ignore the type and return PNG; prefer the smaller result.
    const jpeg = canvas.toDataURL("image/jpeg", 0.85);
    return [webp, jpeg].sort((a, b) => a.length - b.length)[0] || dataUrl;
  } catch {
    return dataUrl;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
