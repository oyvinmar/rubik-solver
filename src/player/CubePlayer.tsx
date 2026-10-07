import { useEffect, useRef } from "react";
import type { TwistyPlayer } from "cubing/twisty";
import { type Move, formatMoves, invertMoves } from "../cube/moves";

/**
 * The only file that talks to cubing.js. Several of the calls below are
 * experimental or undocumented (`experimentalSetupAlg`, `experimentalModel`,
 * `controller.animationController`), so cubing is pinned to an exact version
 * and any upgrade should be checked against this file.
 */

// cubing.js's default camera for a 3x3: white on top, green front, red right.
const HOME_CAMERA = { latitude: 35, longitude: 30 };

// cubing.js's INERTIA_DURATION_MS (not exported), plus a margin.
const DRAG_INERTIA_MS = 600;

// Not exported by cubing.js: SimpleDirection and BoundaryType.
const FORWARDS = 1 as const;
const BACKWARDS = -1 as const;

interface Props {
  moves: readonly Move[];
  /** How many moves of `moves` the cube should show as done. */
  position: number;
  /** Change this to replay the move that leads to `position`. */
  replayKey: number;
}

export function CubePlayer({ moves, position, replayKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<TwistyPlayer | null>(null);
  const shownRef = useRef<number | null>(null);
  const latest = useRef({ position, replayKey });
  latest.current = { position, replayKey };

  // Created once per solution. The 3D code is loaded on demand so it stays
  // out of the main bundle.
  useEffect(() => {
    let cancelled = false;
    let player: TwistyPlayer | undefined;
    void import("cubing/twisty").then(({ TwistyPlayer }) => {
      if (cancelled || !containerRef.current) return;
      player = new TwistyPlayer({
        puzzle: "3x3x3",
        // Setup is the inverse of the solution, so the cube starts out in the
        // state the user entered and the solution brings it back to solved.
        experimentalSetupAlg: formatMoves(invertMoves(moves)),
        alg: formatMoves(moves),
        controlPanel: "none",
        background: "none",
        hintFacelets: "floating",
        cameraLatitude: HOME_CAMERA.latitude,
        cameraLongitude: HOME_CAMERA.longitude,
      });
      // TwistyPlayer collapses to zero height unless sized explicitly.
      player.style.width = "100%";
      player.style.height = "100%";
      containerRef.current.append(player);
      playerRef.current = player;
      shownRef.current = null;
      void showPosition(player, null, latest.current.position);
      shownRef.current = latest.current.position;
    });
    return () => {
      cancelled = true;
      player?.remove();
      playerRef.current = null;
    };
  }, [moves]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || shownRef.current === position) return;
    void showPosition(player, shownRef.current, position);
    shownRef.current = position;
  }, [position]);

  const firstReplay = useRef(replayKey);
  useEffect(() => {
    const player = playerRef.current;
    if (!player || replayKey === firstReplay.current) return;
    void showPosition(player, null, latest.current.position);
  }, [replayKey]);

  return <div ref={containerRef} className="size-full" />;
}

/**
 * Moves the 3D cube to `to`. A single step from `from` animates; anything else
 * (including first show and replays, where `from` is null) jumps to one move
 * before `to` and animates the last move.
 */
async function showPosition(player: TwistyPlayer, from: number | null, to: number) {
  const indexer = await player.experimentalModel.indexer.get();
  const animation = player.controller.animationController;
  type LeafIndex = Parameters<typeof indexer.indexToMoveStartTimestamp>[0];
  const startOf = (index: number) => indexer.indexToMoveStartTimestamp(index as LeafIndex);

  animation.pause();
  // Undo any dragging so the 3D cube matches how the real cube is held. A
  // flick keeps the camera spinning for up to 500 ms after the finger lifts,
  // so reset again once that has run out.
  const resetCamera = () => {
    player.cameraLatitude = HOME_CAMERA.latitude;
    player.cameraLongitude = HOME_CAMERA.longitude;
  };
  resetCamera();
  setTimeout(resetCamera, DRAG_INERTIA_MS);

  if (from !== null && to === from - 1) {
    player.timestamp = startOf(from);
    animation.play({
      direction: BACKWARDS,
      untilBoundary: "move" as never,
      autoSkipToOtherEndIfStartingAtBoundary: false,
    });
    return;
  }
  if (to === 0) {
    player.timestamp = startOf(0);
    return;
  }
  player.timestamp = startOf(to - 1);
  animation.play({
    direction: FORWARDS,
    untilBoundary: "move" as never,
    autoSkipToOtherEndIfStartingAtBoundary: false,
  });
}
