export type MediaDimensions = { width: number; height: number };

/** Fits an animated GIF fully inside a mobile gallery card without cropping. */
export function gifFrameHeight(containerWidth: number, dimensions?: MediaDimensions) {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return 260;
  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) return Math.min(containerWidth, 300);

  const naturalHeight = containerWidth * (dimensions.height / dimensions.width);
  return Math.round(Math.max(140, Math.min(naturalHeight, 420)));
}
