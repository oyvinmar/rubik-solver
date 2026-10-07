import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Color } from "../cube/cube";
import type { FaceView } from "../cube/faceViews";
import { COLOR_HEX, COLOR_LABEL } from "../ui/colors";
import { HoldGuide } from "../ui/HoldGuide";
import { type RGB, classifyFace } from "./classify";
import { GRID_FRACTION, sampleGrid } from "./sampleGrid";

// Centres seen so far this session. Each is a measured reference for its
// colour, which helps tell similar colours apart on later faces.
const knownCentres: Partial<Record<Color, RGB>> = {};

const SAMPLE_INTERVAL_MS = 150;

type Status = "starting" | "live" | "denied" | "failed";

interface Props {
  view: FaceView;
  onCapture: (colors: Color[]) => void;
  onClose: () => void;
}

export function CameraScanner({ view, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [status, setStatus] = useState<Status>("starting");
  const [detected, setDetected] = useState<{ samples: RGB[]; colors: Color[] } | null>(null);
  const faceColor = view.hold.front;

  useLayoutEffect(() => {
    const element = boxRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setBox({ width: element.clientWidth, height: element.clientHeight }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let cancelled = false;
    async function start() {
      // Missing outside secure contexts (plain http on a phone).
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera API unavailable");
      stream = await navigator.mediaDevices.getUserMedia({
        // The back camera, looking at the cube from where you're holding it.
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      if (cancelled || !videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if (!cancelled) setStatus("live");
    }
    start().catch((error: unknown) => {
      if (!cancelled)
        setStatus(error instanceof DOMException && error.name === "NotAllowedError" ? "denied" : "failed");
    });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (status !== "live") return;
    const timer = setInterval(() => {
      const samples = videoRef.current && sampleGrid(videoRef.current, box.width, box.height);
      if (samples) setDetected({ samples, colors: classifyFace(samples, faceColor, knownCentres) });
    }, SAMPLE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [status, box, faceColor]);

  function capture() {
    if (!detected) return;
    knownCentres[faceColor] = detected.samples[4];
    onCapture(detected.colors);
  }

  const side = Math.min(box.width, box.height) * GRID_FRACTION;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white" role="dialog" aria-label="Camera scanner">
      <header className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <HoldGuide hold={view.hold} className="size-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Scan the {COLOR_LABEL[faceColor].toLowerCase()} face</h2>
          <p className="text-sm text-slate-300">{view.instruction}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-2 font-semibold"
          aria-label="Close camera"
        >
          ✕
        </button>
      </header>

      <div ref={boxRef} className="relative min-h-0 flex-1 overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 size-full object-cover" playsInline muted />
        {status === "live" && side > 0 && (
          <div
            className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 grid-cols-3 grid-rows-3 rounded-2xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
            style={{ width: side, height: side }}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="grid place-items-center border border-white/40">
                {detected && (
                  <span
                    className="size-5 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: COLOR_HEX[detected.colors[i]] }}
                    aria-label={detected.colors[i]}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {status !== "live" && (
          <p className="absolute inset-0 grid place-items-center p-8 text-center text-slate-300">
            {status === "starting" && "Starting the camera…"}
            {status === "denied" &&
              "The camera is blocked. Allow camera access for this site in Settings, or enter the colours by tapping."}
            {status === "failed" && "Couldn't start the camera. You can still enter the colours by tapping."}
          </p>
        )}
      </div>

      <footer className="flex flex-col items-center gap-3 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <p className="text-center text-sm text-slate-300">
          Fill the grid with the face, in even light without glare. You can fix any colour afterwards.
        </p>
        <button
          type="button"
          onClick={capture}
          disabled={!detected}
          className="w-full rounded-xl bg-sky-600 py-4 text-lg font-semibold disabled:opacity-40"
        >
          Use these colours
        </button>
      </footer>
    </div>
  );
}
