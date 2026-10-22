const imageMap: Record<string, HTMLImageElement> = {};

export function getCachedImage(src: string): HTMLImageElement {
  if (!src) {
    return new Image();
  }
  if (!imageMap[src]) {
    const img = new Image();
    img.src = src;
    imageMap[src] = img;
  }
  return imageMap[src];
}
