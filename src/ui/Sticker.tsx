import type { Sticker as StickerColor } from "../cube/cube";
import { COLOR_HEX } from "./colors";

interface Props {
  color: StickerColor;
  highlighted?: boolean;
  className?: string;
}

export function stickerStyle(color: StickerColor) {
  return color ? { backgroundColor: COLOR_HEX[color] } : undefined;
}

/** A single sticker square, used by both the entry grid and the net. */
export function Sticker({ color, highlighted, className = "" }: Props) {
  return (
    <span
      className={`block size-full rounded-[18%] ${
        color ? "" : "border-2 border-dashed border-slate-400 bg-slate-200 dark:border-slate-500 dark:bg-slate-800"
      } ${highlighted ? "ring-4 ring-fuchsia-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-950" : ""} ${className}`}
      style={stickerStyle(color)}
    />
  );
}
