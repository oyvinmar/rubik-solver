import { type RGB, medianRGB } from "./classify";

/** Side of the on-screen grid as a share of the smaller side of the video area. */
export const GRID_FRACTION = 0.72;

const SIZE = 90; // the grid is scaled to SIZE×SIZE pixels before sampling
const CELL = SIZE / 3;
const PATCH = 12; // central patch of each cell that's sampled

let canvas: HTMLCanvasElement | undefined;

/**
 * Samples the colour at the centre of each grid cell, in reading order. The
 * video is shown with `object-fit: cover` in a box of `width`×`height`, with
 * the grid centred, so the same crop is applied here.
 */
export function sampleGrid(video: HTMLVideoElement, width: number, height: number): RGB[] | null {
  const { videoWidth, videoHeight } = video;
  if (!videoWidth || !videoHeight || !width || !height) return null;

  const scale = Math.max(width / videoWidth, height / videoHeight);
  const side = (Math.min(width, height) * GRID_FRACTION) / scale;
  const x = (videoWidth - side) / 2;
  const y = (videoHeight - side) / 2;

  canvas ??= Object.assign(document.createElement("canvas"), { width: SIZE, height: SIZE });
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(video, x, y, side, side, 0, 0, SIZE, SIZE);

  return Array.from({ length: 9 }, (_, i) => {
    const left = (i % 3) * CELL + (CELL - PATCH) / 2;
    const top = Math.floor(i / 3) * CELL + (CELL - PATCH) / 2;
    return medianRGB(context.getImageData(left, top, PATCH, PATCH).data);
  });
}
