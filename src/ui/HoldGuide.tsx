import type { Color } from "../cube/cube";
import { COLOR_HEX } from "./colors";

type Point = readonly [number, number];
type Quad = readonly [topLeft: Point, topRight: Point, bottomLeft: Point, bottomRight: Point];

// Isometric cube in a 100×100 box: top, front (lower left) and right faces.
const FACES: Record<"top" | "front" | "right", Quad> = {
  top: [
    [50, 4],
    [92, 27],
    [8, 27],
    [50, 50],
  ],
  front: [
    [8, 27],
    [50, 50],
    [8, 73],
    [50, 96],
  ],
  right: [
    [50, 50],
    [92, 27],
    [50, 96],
    [92, 73],
  ],
};

function lerp(quad: Quad, u: number, v: number): string {
  const [tl, tr, bl, br] = quad;
  const x = (1 - v) * ((1 - u) * tl[0] + u * tr[0]) + v * ((1 - u) * bl[0] + u * br[0]);
  const y = (1 - v) * ((1 - u) * tl[1] + u * tr[1]) + v * ((1 - u) * bl[1] + u * br[1]);
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function sticker(quad: Quad, row: number, col: number): string {
  const inset = 0.06;
  const [u0, u1, v0, v1] = [(col + inset) / 3, (col + 1 - inset) / 3, (row + inset) / 3, (row + 1 - inset) / 3];
  return [lerp(quad, u0, v0), lerp(quad, u1, v0), lerp(quad, u1, v1), lerp(quad, u0, v1)].join(" ");
}

interface Props {
  hold: { top: Color; front: Color; right: Color };
  className?: string;
}

/** A small picture of how to hold the cube. */
export function HoldGuide({ hold, className }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`Hold the cube with ${hold.top} on top, ${hold.front} facing you and ${hold.right} on the right`}
    >
      {(Object.keys(FACES) as (keyof typeof FACES)[]).map((face) => (
        <g key={face}>
          <polygon
            points={[FACES[face][0], FACES[face][1], FACES[face][3], FACES[face][2]].map((p) => p.join(",")).join(" ")}
            fill="#0f172a"
          />
          {[0, 1, 2].flatMap((row) =>
            [0, 1, 2].map((col) => (
              <polygon key={`${row}${col}`} points={sticker(FACES[face], row, col)} fill={COLOR_HEX[hold[face]]} />
            )),
          )}
        </g>
      ))}
    </svg>
  );
}
