"use client";

import { useEffect, useRef } from "react";
import type * as OrtTypes from "onnxruntime-web";

// ---- NCA config -----------------------------------------------------------
const GRID = 64;
const CHANNELS = 16;
const PLANE = GRID * GRID;

const SEED_X = 32;
const SEED_Y = 12;
const SEED_CHANNEL = 3; // alpha channel holds the seed

const TOTAL_STEPS = 120; // NCA age reached at 100% scroll
const STEPS_PER_FRAME = 2; // max inference steps per animation frame
const FRAME_TIME_BUDGET_MS = 14; // stop batching if inference gets slow
const SETTLE_STEPS = 20; // extra steps granted whenever scroll moves forward

// ---- Cursor damage / healing ------------------------------------------------
const DAMAGE_RADIUS = 2.5; // in grid cells; every channel inside is zeroed
const HEAL_STEPS = 110; // inference steps granted after each damage event
const RESTORE_STEPS = 30; // during the last N heal steps, blend toward pristine
const RESTORE_BLEND = 0.12; // state += (pristine - state) * blend
const MIN_AGE_FOR_DAMAGE = 4;
const MAX_QUEUED_BRUSH = 128;

// ---- Look -----------------------------------------------------------------
const ALPHA_CUTOFF = 0.12; // suppress faint halo noise

const MODEL_URL = "/models/node_tree_thick.onnx";
const ORT_WASM_PATH = "/ort/";

// 1. Add the onReady prop to the type definition
type Props = { debug?: boolean; onReady?: () => void };

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

function makeSeed(): Float32Array {
  const s = new Float32Array(CHANNELS * PLANE);
  s[SEED_CHANNEL * PLANE + SEED_Y * GRID + SEED_X] = 1.0;
  return s;
}

// 2. Destructure the new onReady prop
export default function CanvasNCA({ debug = false, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(GRID, GRID);

    // NCHW layout: index = c * PLANE + y * GRID + x
    const state = makeSeed();

    // history[k] = state after k growth steps. history[0] = single root seed.
    const history: Float32Array[] = [new Float32Array(state)];

    let ort: typeof OrtTypes;
    let session: OrtTypes.InferenceSession | null = null;
    let inputName = "";
    let outputName = "";

    let age = 0; // growth steps taken so far
    let allowed = 0; // growth steps allowed by scroll
    let lastAllowed = 0;
    let progress = 0; // 0..1
    let healBudget = 0; // steps left to repair damage
    let settleBudget = 0; // extra steps to lock branches in after scrolling forward
    let running = false; // guards against overlapping session.run()
    let epoch = 0; // bumped on rewind so in-flight results are discarded
    let cancelled = false;
    let raf = 0;
    let frame = 0;
    let lastG: [number, number] | null = null;
    const damageQueue: Array<[number, number]> = [];

    // ---- Scroll binding ---------------------------------------------------
    const updateScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      allowed = Math.round(progress * TOTAL_STEPS);
      if (allowed > lastAllowed) settleBudget = SETTLE_STEPS;
      lastAllowed = allowed;
    };

    // ---- Rendering: refined cyber-teal palette ----------------------------
    const draw = () => {
      const d = image.data;
      for (let i = 0; i < PLANE; i++) {
        const a = state[3 * PLANE + i];
        const o = i * 4;

        if (!(a >= ALPHA_CUTOFF)) {
          // also catches NaN
          d[o] = d[o + 1] = d[o + 2] = d[o + 3] = 0;
          continue;
        }

        const core = Math.max(0, (a - 0.65) / 0.35);
        d[o] = clamp255(14 * a);
        d[o + 1] = clamp255(165 * a + 45 * core);
        d[o + 2] = clamp255(210 * a + 45 * core);
        d[o + 3] = clamp255(a * 255);
      }
      ctx.putImageData(image, 0, 0);
    };

    // ---- Rewind (scroll up) -----------------------------------------------
    const rewindTo = (target: number) => {
      epoch++; // invalidate any session.run() currently in flight
      age = target;
      state.set(history[target]);
      history.length = target + 1; // drop the future; it will be regrown
      healBudget = 0;
      settleBudget = 0; // settling from a rewound seed would regrow the tree
      damageQueue.length = 0;
      draw();
    };

    // ---- Damage -----------------------------------------------------------
    // Listen on window: the canvas sits at z-[-1], so it never receives events.
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const gx = Math.floor(((e.clientX - rect.left) / rect.width) * GRID);
      const gy = Math.floor(((e.clientY - rect.top) / rect.height) * GRID);
      if (gx < 0 || gx >= GRID || gy < 0 || gy >= GRID) {
        lastG = null;
        return;
      }
      if (age < MIN_AGE_FOR_DAMAGE) {
        lastG = [gx, gy];
        return;
      }

      // Interpolate from the previous cursor cell so fast sweeps leave no gaps
      const [px, py] = lastG ?? [gx, gy];
      const n = Math.max(Math.abs(gx - px), Math.abs(gy - py));
      if (n === 0) {
        damageQueue.push([gx, gy]);
      } else {
        for (let i = 1; i <= n; i++) {
          damageQueue.push([
            Math.round(px + ((gx - px) * i) / n),
            Math.round(py + ((gy - py) * i) / n),
          ]);
        }
      }
      lastG = [gx, gy];
      if (damageQueue.length > MAX_QUEUED_BRUSH) {
        damageQueue.splice(0, damageQueue.length - MAX_QUEUED_BRUSH);
      }
    };

    // Clean brush: zero every channel inside the radius, nothing else.
    const applyDamage = () => {
      const r2max = DAMAGE_RADIUS * DAMAGE_RADIUS;
      const reach = Math.ceil(DAMAGE_RADIUS);
      for (const [cx, cy] of damageQueue) {
        for (let dy = -reach; dy <= reach; dy++) {
          for (let dx = -reach; dx <= reach; dx++) {
            if (dx * dx + dy * dy > r2max) continue;
            const x = cx + dx;
            const y = cy + dy;
            if (x < 0 || x >= GRID || y < 0 || y >= GRID) continue;
            const p = y * GRID + x;
            for (let c = 0; c < CHANNELS; c++) state[c * PLANE + p] = 0.0;
          }
        }
      }
      damageQueue.length = 0;
      healBudget = HEAL_STEPS; // let the model run even if scroll is idle
      draw(); // show the damage immediately
    };

    // Gentle pull toward the pristine cached frame (last RESTORE_STEPS of healing)
    const restoreTowardPristine = () => {
      const pristine = history[age];
      if (!pristine) return;
      for (let k = 0; k < state.length; k++) {
        state[k] += (pristine[k] - state[k]) * RESTORE_BLEND;
      }
    };

    // ---- Inference: up to N steps per frame -------------------------------
    const runSteps = async (maxSteps: number) => {
      running = true;
      const myEpoch = epoch;
      const t0 = performance.now();
      try {
        for (let i = 0; i < maxSteps; i++) {
          const grow = age < allowed;
          const heal = !grow && healBudget > 0;
          const settle = !grow && !heal && settleBudget > 0;
          if (!grow && !heal && !settle) break;

          const input = new ort.Tensor("float32", new Float32Array(state), [
            1,
            CHANNELS,
            GRID,
            GRID,
          ]);
          const out = await session!.run({ [inputName]: input });
          if (myEpoch !== epoch || cancelled) return; // rewound mid-flight

          state.set(out[outputName].data as Float32Array);

          if (grow) {
            age++;
            history[age] = new Float32Array(state);
            if (healBudget > 0) healBudget--; // growth steps also repair damage
          } else if (heal) {
            // last RESTORE_STEPS: guarantee convergence to the intact tree
            if (healBudget <= RESTORE_STEPS) restoreTowardPristine();
            healBudget--;
          } else {
            settleBudget--;
            // record the settled state so rewinds return crisp frames,
            // but never save a state that is still mid-repair
            if (healBudget === 0) history[age] = new Float32Array(state);
          }

          // Repair finished: this frame is clean, so cache it
          if (healBudget === 0 && (heal || grow)) {
            history[age] = new Float32Array(state);
          }

          // Damage that arrived while inference was in flight lands now
          if (damageQueue.length) applyDamage();

          if (performance.now() - t0 > FRAME_TIME_BUDGET_MS) break;
        }
        draw();
      } catch (err) {
        console.error("[CanvasNCA] inference failed", err);
        session = null; // stop the loop instead of spamming errors
      } finally {
        running = false;
      }
    };

    // ---- rAF loop ---------------------------------------------------------
    const tick = () => {
      raf = requestAnimationFrame(tick);

      if (debug && hudRef.current && frame++ % 6 === 0) {
        hudRef.current.textContent =
          `scroll ${(progress * 100).toFixed(0)}%  |  age ${age}/${allowed} (max ${TOTAL_STEPS})  |  settle ${settleBudget}  |  heal ${healBudget}  |  history ${history.length}`;
      }

      // Scrolling up: rewind instantly, even if an inference is in flight
      if (allowed < age) {
        rewindTo(allowed);
        return;
      }

      if (!session) return;

      // Apply cursor damage immediately when no inference is pending
      if (!running && damageQueue.length) applyDamage();
      if (running) return;

      if (age >= allowed && healBudget <= 0 && settleBudget <= 0) return; // idle
      void runSteps(STEPS_PER_FRAME);
    };

    // ---- Boot -------------------------------------------------------------
    (async () => {
      try {
        const mod = await import("onnxruntime-web/wasm");
        ort = mod as unknown as typeof OrtTypes;
        ort.env.wasm.wasmPaths = ORT_WASM_PATH;
        ort.env.wasm.numThreads = 1; // avoids needing COOP/COEP headers

        ort.env.wasm.proxy = false;
        const s = await ort.InferenceSession.create(MODEL_URL, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        });
        if (cancelled) {
          void s.release();
          return;
        }
        session = s;
        inputName = s.inputNames[0];
        outputName = s.outputNames[0];
        console.info("[CanvasNCA] model ready", {
          inputs: s.inputNames,
          outputs: s.outputNames,
        });
        draw(); // shows the seed pixel
        
        // 3. Fire the onReady callback to signal the bootloader to clear
        if (onReady) onReady();
        
      } catch (err) {
        console.error("[CanvasNCA] failed to load model", err);
      }
    })();

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      window.removeEventListener("mousemove", onMouseMove);
      void session?.release();
    };
  }, [debug, onReady]); // 4. Add onReady to dependency array

  return (
    <>
      <div
        className="fixed inset-0 z-[-1] flex items-center justify-center overflow-hidden bg-[#05070d]"
        aria-hidden
      >
        {/* soft ambient cyan glow behind the tree */}
        <div
          className="pointer-events-none absolute"
          style={{
            width: "min(120vh, 120vw)",
            height: "min(120vh, 120vw)",
            background:
              "radial-gradient(circle at center, rgba(34,211,238,0.10) 0%, rgba(6,182,212,0.04) 35%, transparent 65%)",
          }}
        />
        <canvas
          ref={canvasRef}
          width={GRID}
          height={GRID}
          className="relative aspect-square opacity-50 drop-shadow-[0_0_16px_rgba(34,211,238,0.22)]"
          style={{
            imageRendering: "pixelated",
            // guaranteed square: ~85vh tall, never wider than 90vw
            width: "min(85vh, 90vw)",
            height: "min(85vh, 90vw)",
          }}
        />
      </div>
      {debug && (
        <div
          ref={hudRef}
          className="pointer-events-none fixed bottom-4 left-4 z-50 rounded bg-black/70 px-3 py-2 font-mono text-xs text-cyan-300"
        />
      )}
    </>
  );
}
