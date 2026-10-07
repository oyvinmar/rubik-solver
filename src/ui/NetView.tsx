import { FACES, FACE_COLOR, type Face, type Sticker as StickerColor } from "../cube/cube";
import { Sticker } from "./Sticker";

// Position of each face in the cross-shaped net (column, row).
const LAYOUT: Record<Face, [col: number, row: number]> = {
  U: [2, 1],
  L: [1, 2],
  F: [2, 2],
  R: [3, 2],
  B: [4, 2],
  D: [2, 3],
};

interface Props {
  stickers: readonly StickerColor[];
  highlighted?: ReadonlySet<number>;
  activeFace?: Face;
  onFaceClick?: (face: Face) => void;
  /** Gap between stickers, as a Tailwind class. */
  gap?: string;
  className?: string;
}

/** The unfolded cube: U above F, then L F R B in a row, then D below F. */
export function NetView({ stickers, highlighted, activeFace, onFaceClick, gap = "gap-px", className = "" }: Props) {
  return (
    <div className={`grid grid-cols-4 grid-rows-3 gap-1 ${className}`}>
      {FACES.map((face, f) => {
        const [col, row] = LAYOUT[face];
        const content = (
          <span className={`grid size-full grid-cols-3 rounded-[8%] bg-slate-900 p-[4%] ${gap}`}>
            {stickers.slice(f * 9, f * 9 + 9).map((color, i) => (
              <Sticker key={i} color={color} highlighted={highlighted?.has(f * 9 + i)} />
            ))}
          </span>
        );
        const style = { gridColumnStart: col, gridRowStart: row };
        const ring = face === activeFace ? "outline-2 outline-offset-2 outline-sky-500" : "";
        return onFaceClick ? (
          <button
            key={face}
            type="button"
            style={style}
            className={`aspect-square rounded-sm ${ring}`}
            onClick={() => onFaceClick(face)}
            aria-label={`Edit the ${FACE_COLOR[face]} face`}
          >
            {content}
          </button>
        ) : (
          <div key={face} style={style} className={`aspect-square ${ring}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
