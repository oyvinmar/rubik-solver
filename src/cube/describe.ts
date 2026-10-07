import type { Face } from "./cube";
import type { Move } from "./moves";

/**
 * Plain-language move descriptions from the point of view of someone holding
 * the cube with white on top and green facing them. "Clockwise" is avoided
 * for faces pointing away, where it reads backwards.
 */

const LAYER: Record<Face, string> = {
  U: "Top layer",
  D: "Bottom layer",
  R: "Right side",
  L: "Left side",
  F: "Front face",
  B: "Back layer",
};

const QUARTER: Record<Face, [clockwise: string, anticlockwise: string]> = {
  U: ["front row moves left", "front row moves right"],
  D: ["front row moves right", "front row moves left"],
  R: ["front moves up", "front moves down"],
  L: ["front moves down", "front moves up"],
  F: ["turn clockwise", "turn anticlockwise"],
  B: ["top row moves left", "top row moves right"],
};

export function describeMove({ face, turns }: Move): string {
  if (turns === 2) return `${LAYER[face]}: half turn, either way`;
  return `${LAYER[face]}: ${QUARTER[face][turns === 1 ? 0 : 1]}`;
}
