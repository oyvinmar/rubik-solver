# Rubik's Cube Solver: spec

A mobile-first progressive web app. You enter the colours of your scrambled 3×3 cube, and it walks you through a short solution one move at a time. Everything runs on the phone, offline.

These decisions were agreed on 2026-10-07. The reasoning is kept short; change the spec when a decision changes.

## Scope

- **Solver only.** It doesn't teach a solving method. A tutor mode can come later without changing the core.
- **Personal use, shareable by link.** English only, no accounts, no analytics.
- **iPhone first, Android supported.** Only the current iOS Safari and current Chrome. No workarounds for older versions.
- **Fully offline.** No backend, and solving happens on the device.
- **No extras in v1.** No timer, history or pattern generator. The only extra is a hidden random-cube button: add `?debug` to the URL.

## Holding the cube

The app assumes white on top and green facing you, with the standard Western colour scheme: white opposite yellow, green opposite blue, red opposite orange. Red is on the right. Centres can't move, so the app fills them in during entry. A small picture of the cube in this position appears during entry and on the solution screen.

## Screens

No URL routing library; app state decides which screen is shown (`src/app/state.ts`).

1. **Enter colours**, one face at a time, in the order green, red, blue, orange, white, yellow.
   - Each face shows an instruction and a picture of how to hold the cube, so the on-screen grid matches what you see. Coloured bars around the grid show which face borders each side.
   - Pick a colour from the palette, then tap stickers. Tapping a sticker that already has the selected colour clears it. Each palette colour shows how many are left.
   - A small net in the corner shows overall progress. Tap it to jump to any face.
   - **Scan** opens the back camera instead (see Camera scanning). The captured colours fill the face, and you check them and tap to fix any that are wrong.
2. **Review**: the whole unfolded net, with every problem listed (see below). Tap a face to go back and edit it. Solve is disabled until the cube is valid.
3. **Solution**: an animated 3D cube plus the current move.
   - **Demonstration first.** When a move becomes current, the 3D cube animates it, so you see the turn before you make it. The cube therefore always shows the state _after_ the current move.
   - The move shows in standard notation (`R`, `U'`, `B2`) next to a description from where you're holding the cube, e.g. "Back layer: top row moves left". The descriptions are tested against the cube model.
   - Tapping the large lower area moves to the next move. There's also back, replay and autoplay (slow, normal or fast).
   - Ghost stickers show the hidden faces. Drag to rotate the 3D cube; it snaps back to the holding view on the next move.
   - The screen stays awake (Wake Lock API) until the cube is solved.

## Impossible cubes

`src/cube/validate.ts` explains each problem and outlines the affected stickers where it can:

| Problem                                                                                       | Outlined                                      |
| --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Blank stickers                                                                                | yes                                           |
| A colour used more or fewer than 9 times                                                      | no                                            |
| An edge or corner that can't exist (two of one colour, opposite colours, mirror-image corner) | yes                                           |
| The same piece entered twice                                                                  | yes                                           |
| A flipped edge, a twisted corner, two pieces swapped                                          | no, because it can't be pinned to one sticker |

The messages for the last three mention that the physical cube itself may have been tampered with.

Our validation is stricter than min2phase's. min2phase identifies a corner by its two side colours and never checks whether the top/bottom sticker is white or yellow. Without our check, it would "solve" some impossible cubes with a sequence that doesn't solve the real one. Always validate before calling the solver.

## Camera scanning

`src/camera/`. Scanning writes into the same stickers as tap entry, one face at a time, so it shares the holding instructions and the tap-to-fix step.

- **Lining up:** a 3×3 grid in the middle of a live view from the back camera. Hold the cube as instructed so the face fills the grid. The back camera looks at the cube from your side, so the picture isn't mirrored and the grid matches the on-screen face.
- **Sampling:** about 7 times a second, the median colour of the central patch of each grid cell (`sampleGrid.ts`). The median ignores small highlights. The crop accounts for the video being shown with `object-fit: cover`.
- **Matching** (`classify.ts`): each sample goes to the nearest of six reference colours in CIE Lab, with lightness counting for half so that shadows matter less.
  - The face's centre sticker is the reference for its own colour, measured under the current light.
  - Centres from faces scanned earlier in the session are remembered as references for their colours.
  - Colours not seen yet use a typical value, corrected per colour channel by how far the measured centres are from typical. Each channel is only corrected from colours that are strong in it (red says little about green and blue light), and otherwise by overall brightness.
- **Preview:** a dot in each grid cell shows the detected colour live. "Use these colours" fills the face.
- **Accuracy (simulated, in scan order):** 0% wrong in neutral, mildly tinted or dim light; under 0.5% in strongly warm or cool light; up to about 3% in dim, warm light, mostly yellow or red read as orange. Real phone cameras correct white balance automatically, so real-world results depend mostly on glare and very dim light. Tap-to-fix covers the rest.
- **No camera** (denied, missing, or not over HTTPS): the scanner says so and points you to tap entry.

## Saving and updates

- The current solve (stickers, face, solution, step) is saved to `localStorage` on every change. There's no history.
- **Fresh launch** with unfinished progress: the app asks before resuming. **Reload in the same session**, e.g. after an automatic update, resumes silently. `sessionStorage` tells the two apart.
- Updates install automatically, and the page reloads when a new service worker activates (`registerType: "autoUpdate"`).
- On iOS Safari, before the app is installed, a one-time dismissible hint explains Share → Add to Home Screen.

## Technical

- **Stack:** Vite, React 19, TypeScript, Tailwind v4, `vite-plugin-pwa`, pnpm, Vitest, Prettier.
- **Solver:** [min2phase.js](https://github.com/cs0x7f/min2phase.js) (Kociemba two-phase), copied into `src/solver/vendor/` under its MIT option. The only change is an ES module export. It runs in a Web Worker (`src/solver/solver.worker.ts`), which builds its lookup tables at app start while you enter colours. Solutions are at most 21 moves.
- **3D cube:** cubing.js `TwistyPlayer`, version pinned exactly. It's only used in `src/player/CubePlayer.tsx`, because it relies on experimental or undocumented APIs (`experimentalSetupAlg`, `experimentalModel`, `controller.animationController`). Check that file when upgrading cubing. It loads on demand when the Solution screen opens. To show the entered cube, the setup moves are set to the solution reversed.
- **Cube model** (`src/cube/`): 54 stickers in Kociemba's facelet order (URFDLB). Moves and face neighbours are derived from 3D sticker coordinates (`geometry.ts`), not hand-written tables.
- **Offline caching:** Workbox caches the whole app except cubing.js files for other puzzles (see `globIgnores` in `vite.config.ts`).
- **Licences:** minification strips licence comments. The build writes `licenses.txt` for npm packages (Vite's `build.license`). `public/third-party-notices.txt` covers the copied-in min2phase.js and links to cubing.js's source, as MPL-2.0 requires. The "Solved!" screen links to it.
- **Build:** the build script forces `NODE_ENV=production`, because a shell-wide `NODE_ENV=development` otherwise makes Vite bundle React's slower development build.

## Testing

Vitest unit tests cover the core logic:

- Move permutations, notation, and the move descriptions (checked against where stickers actually go).
- Every validation rule. A fuzz test randomly swaps stickers and checks that nothing we accept is unsolvable.
- Solver round trip: scramble → solve → apply → solved, for 100 scrambles plus 50 uniformly random states.

- Camera colour matching under simulated lighting, following the real scan order, with a maximum error rate per lighting condition.

There are no automated browser tests in the repo. Check installing, offline use, the screen staying awake and camera scanning by hand on an iPhone.

## Hosting

- Source: https://github.com/oyvinmar/rubik-solver (public).
- Live: https://oyvinmar-rubik-solver.vercel.app. The Vercel project is `rubik-solver`, and `vercel.json` pins the install and build commands. `rubik-solver.vercel.app` belongs to someone else's project.
- Deploys: automatic on push to `main` once the Vercel GitHub App has access to the repo; until then, `vercel deploy --prod`.
