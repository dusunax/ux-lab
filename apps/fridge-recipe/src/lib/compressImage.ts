const MAX_PX = 1024;
const QUALITY = 0.82;

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { width: w, height: h } = img;
      const scale = Math.min(1, MAX_PX / Math.max(w, h));
      const cw = Math.round(w * scale);
      const ch = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext("2d")!.drawImage(img, 0, 0, cw, ch);

      resolve(canvas.toDataURL("image/jpeg", QUALITY));
    };

    img.onerror = reject;
    img.src = objectUrl;
  });
}
