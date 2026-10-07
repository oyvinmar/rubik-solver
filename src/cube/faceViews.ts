import { type Color, type Face, FACE_COLOR } from "./cube";
import { neighbourFace } from "./geometry";

/**
 * The order faces are entered in, and how to hold the cube for each so the
 * grid on screen matches what you see.
 */

export interface FaceView {
  face: Face;
  instruction: string;
  /** Colours of the faces bordering this one, as seen on screen. */
  edges: { top: Color; right: Color; bottom: Color; left: Color };
  /** How the whole cube is held while looking at this face. */
  hold: { top: Color; front: Color; right: Color };
}

const INSTRUCTIONS: [Face, string][] = [
  ["F", "Hold the cube with white on top and green facing you."],
  ["R", "Keep white on top and turn the cube so red faces you."],
  ["B", "Keep white on top and turn the cube so blue faces you."],
  ["L", "Keep white on top and turn the cube so orange faces you."],
  ["U", "Turn back to green, then tip the top towards you so white faces you, with green at the bottom."],
  ["D", "Turn back to green, then tip the bottom towards you so yellow faces you, with green at the top."],
];

export const FACE_VIEWS: readonly FaceView[] = INSTRUCTIONS.map(([face, instruction]) => {
  const edges = {
    top: FACE_COLOR[neighbourFace(face, 0, 1)],
    right: FACE_COLOR[neighbourFace(face, 1, 2)],
    bottom: FACE_COLOR[neighbourFace(face, 2, 1)],
    left: FACE_COLOR[neighbourFace(face, 1, 0)],
  };
  return { face, instruction, edges, hold: { top: edges.top, front: FACE_COLOR[face], right: edges.right } };
});

export const HOME_HOLD = FACE_VIEWS[0].hold;
