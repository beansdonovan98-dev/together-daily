export type MediaDimensions = { width: number; height: number };

/**
 * Preserves every pixel by deriving a bounded frame height from the original
 * media dimensions. The image renderer uses `contain`, so no GIF or photo is
 * cropped while it scales to the available card width.
 */
export function mediaFrameHeight(
  containerWidth: number,
  dimensions?: MediaDimensions,
  minimumHeight = 180,
  maximumHeight = 640,
) {
  const width = Number.isFinite(containerWidth) && containerWidth > 0
    ? containerWidth
    : 320;

  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
    return Math.round(Math.max(minimumHeight, Math.min(width, maximumHeight)));
  }

  const naturalHeight = width * (dimensions.height / dimensions.width);
  return Math.round(Math.max(minimumHeight, Math.min(naturalHeight, maximumHeight)));
}

/** Fits an animated GIF fully inside a mobile gallery card without cropping. */
export function gifFrameHeight(containerWidth: number, dimensions?: MediaDimensions) {
  return mediaFrameHeight(containerWidth, dimensions, 180, 640);
}
