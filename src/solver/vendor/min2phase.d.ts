declare const min2phase: {
  /**
   * Solves a 54-character facelet string in URFDLB order. Returns moves such
   * as "R2 U' F " (note the padding), or "Error N" for an invalid cube:
   * 1 bad colours, 2 missing edge, 3 flipped edge, 4 missing corner,
   * 5 twisted corner, 6 parity, 7 no solution within max depth, 8 probe limit.
   */
  solve(facelets: string): string;
  /** Builds all pruning tables up front instead of on the first solve. */
  initFull(): void;
  /** A uniformly random solvable cube as a facelet string. */
  randomCube(): string;
  fromScramble(scramble: string): string;
};
export default min2phase;
