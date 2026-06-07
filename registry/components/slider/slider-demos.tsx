'use client';

import { LiquidSlider } from '@/components/ui/liquid-slider';
import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';

// ─── Animated gradient backdrop (same as button docs) ──────────────────────

function GlassStage({ children, tall = false }: { children: ReactNode; tall?: boolean }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-6 w-full overflow-hidden rounded-xl border ${tall ? 'min-h-[200px]' : 'min-h-[140px]'} p-10`}
    >
      <span className="pointer-events-none absolute inset-0 -z-0">
        <span
          className="absolute -top-10 -left-10 h-56 w-56 rounded-full opacity-70 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #a855f7, #6366f1)',
            animation: 'lb-drift1 8s ease-in-out infinite alternate',
          }}
        />
        <span
          className="absolute top-4 right-0 h-44 w-44 rounded-full opacity-60 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #ec4899, #f97316)',
            animation: 'lb-drift2 7s ease-in-out infinite alternate',
          }}
        />
        <span
          className="absolute -bottom-8 left-1/3 h-48 w-48 rounded-full opacity-60 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #06b6d4, #10b981)',
            animation: 'lb-drift3 9s ease-in-out infinite alternate',
          }}
        />
      </span>
      <style>{`
        @keyframes lb-drift1 { from { transform: translate(0px, 0px) scale(1); } to { transform: translate(30px, 20px) scale(1.15); } }
        @keyframes lb-drift2 { from { transform: translate(0px, 0px) scale(1); } to { transform: translate(-25px, 15px) scale(1.1); } }
        @keyframes lb-drift3 { from { transform: translate(0px, 0px) scale(1); } to { transform: translate(20px, -20px) scale(1.2); } }
      `}</style>
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}

// ─── Hero demo ─────────────────────────────────────────────────────────────

export function LiquidSliderDemo() {
  const [value, setValue] = useState(50);

  const events = useCallback(
    () => ({
      input: ({ value }: { value: number; element: Element }) => setValue(value),
    }),
    [],
  );

  return (
    <GlassStage tall>
      <LiquidSlider min={0} max={100} value={value} className="w-full" events={events()} />
      <p
        className="text-sm font-medium tabular-nums"
        style={{
          color: 'white',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      >
        Value: {value}
      </p>
    </GlassStage>
  );
}

// ─── Controlled value ──────────────────────────────────────────────────────

export function LiquidSliderControlledDemo() {
  const [value, setValue] = useState(30);

  return (
    <GlassStage tall>
      <LiquidSlider
        min={0}
        max={100}
        value={value}
        className="w-full"
        events={{
          input: ({ value }) => setValue(value),
        }}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => setValue((v) => Math.max(0, v - 10))}
          className="rounded-md bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          −10
        </button>
        <span className="min-w-[4ch] text-center text-sm font-semibold text-white tabular-nums">
          {value}
        </span>
        <button
          onClick={() => setValue((v) => Math.min(100, v + 10))}
          className="rounded-md bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          +10
        </button>
      </div>
    </GlassStage>
  );
}

// ─── Step demo ─────────────────────────────────────────────────────────────

export function LiquidSliderStepDemo() {
  const [value, setValue] = useState(25);

  return (
    <GlassStage>
      <LiquidSlider
        min={0}
        max={100}
        value={value}
        options={{ step: 25 }}
        className="w-full"
        events={{ input: ({ value }) => setValue(value) }}
      />
      <p
        className="text-sm font-medium text-white tabular-nums"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
      >
        Snaps to: 0 · 25 · 50 · 75 · 100 — current: {value}
      </p>
    </GlassStage>
  );
}

// ─── Custom range demo ─────────────────────────────────────────────────────

export function LiquidSliderRangeDemo() {
  const [temp, setTemp] = useState(20);

  return (
    <GlassStage>
      <LiquidSlider
        min={-20}
        max={50}
        value={temp}
        className="w-full"
        events={{ input: ({ value }) => setTemp(value) }}
      />
      <p
        className="text-sm font-medium text-white tabular-nums"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
      >
        Temperature: {temp}°C
      </p>
    </GlassStage>
  );
}

// ─── Events demo ──────────────────────────────────────────────────────────

export function LiquidSliderEventsDemo() {
  const [live, setLive] = useState(50);
  const [committed, setCommitted] = useState(50);

  return (
    <GlassStage tall>
      <LiquidSlider
        min={0}
        max={100}
        value={live}
        className="w-full"
        events={{
          input: ({ value }) => setLive(value),
          change: ({ value }) => setCommitted(value),
        }}
      />
      <div
        className="flex flex-col items-center gap-1 text-sm text-white"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
      >
        <span>
          Live (input): <strong>{live}</strong>
        </span>
        <span>
          Committed (change): <strong>{committed}</strong>
        </span>
      </div>
    </GlassStage>
  );
}
