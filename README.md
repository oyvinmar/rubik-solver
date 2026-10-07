# Rubik's Cube Solver

A progressive web app for solving a 3×3 Rubik's cube on your phone. Scan or tap in your cube's colours one face at a time, then follow a solution of at most 21 moves on an animated 3D cube. Everything runs on the device and works offline once installed.

Live at https://oyvinmar-rubik-solver.vercel.app. On an iPhone, open it in Safari and use Share → Add to Home Screen.

See [docs/spec.md](docs/spec.md) for what it does and why.

## Development

```sh
pnpm install
pnpm dev          # dev server
pnpm test         # unit tests (watch mode)
pnpm build        # type-check and production build
pnpm preview      # serve the production build, including the service worker
pnpm format       # Prettier
```

Add `?debug` to the URL to get a "random cube" button on the entry screen.

The app icons in `public/` are generated from `public/favicon.svg` with `pnpm generate-pwa-assets`.

## Credits

- Solving: [min2phase.js](https://github.com/cs0x7f/min2phase.js) by Chen Shuang, used under the MIT licence. It's copied into `src/solver/vendor/`.
- 3D cube: [cubing.js](https://github.com/cubing/cubing.js), used unmodified under the MPL-2.0.

The app links to [public/third-party-notices.txt](public/third-party-notices.txt) from the "Solved!" screen. The build also generates `licenses.txt` for every bundled npm package.

## Licence

MIT
