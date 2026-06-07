'use client';

import { LiquidSwitch } from '@/components/ui/liquid-switch';
import { useState } from 'react';
import type { ReactNode } from 'react';

// ─── Animated gradient backdrop ────────────────────────────────────────────

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
        @keyframes lb-drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(30px,20px) scale(1.15); } }
        @keyframes lb-drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-25px,15px) scale(1.1); } }
        @keyframes lb-drift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,-20px) scale(1.2); } }
      `}</style>
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 w-full">
        {children}
      </div>
    </div>
  );
}

// ─── Hero demo ─────────────────────────────────────────────────────────────

export function LiquidSwitchDemo() {
  const [checked, setChecked] = useState(false);

  return (
    <GlassStage tall>
      <LiquidSwitch checked={checked} onCheckedChange={setChecked} />
      <p
        className="text-sm font-medium tabular-nums"
        style={{
          color: 'white',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      >
        {checked ? 'On' : 'Off'}
      </p>
    </GlassStage>
  );
}

// ─── Uncontrolled (defaultChecked) ─────────────────────────────────────────

export function LiquidSwitchUncontrolledDemo() {
  return (
    <GlassStage>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <LiquidSwitch defaultChecked={false} />
          <span className="text-xs text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            starts off
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LiquidSwitch defaultChecked={true} />
          <span className="text-xs text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            starts on
          </span>
        </div>
      </div>
    </GlassStage>
  );
}

// ─── Controlled toggle ─────────────────────────────────────────────────────

export function LiquidSwitchControlledDemo() {
  const [checked, setChecked] = useState(false);

  return (
    <GlassStage tall>
      <LiquidSwitch checked={checked} onCheckedChange={setChecked} />
      <div className="flex items-center gap-3">
        <button
          onClick={() => setChecked(false)}
          className="rounded-md px-3 py-1 text-sm font-medium text-white backdrop-blur-sm transition-colors"
          style={{
            background: checked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)',
          }}
        >
          Force Off
        </button>
        <button
          onClick={() => setChecked(true)}
          className="rounded-md px-3 py-1 text-sm font-medium text-white backdrop-blur-sm transition-colors"
          style={{
            background: checked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
          }}
        >
          Force On
        </button>
      </div>
      <p
        className="text-sm text-white tabular-nums"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
      >
        State: <strong>{checked ? 'true' : 'false'}</strong>
      </p>
    </GlassStage>
  );
}

// ─── With label ────────────────────────────────────────────────────────────

export function LiquidSwitchWithLabelDemo() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  const labelStyle = {
    color: 'white',
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  };

  return (
    <GlassStage tall>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {[
          {
            label: 'Push notifications',
            checked: notifications,
            onChange: setNotifications,
          },
          {
            label: 'Dark mode',
            checked: darkMode,
            onChange: setDarkMode,
          },
          {
            label: 'Analytics',
            checked: analytics,
            onChange: setAnalytics,
          },
        ].map(({ label, checked, onChange }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm font-medium" style={labelStyle}>
              {label}
            </span>
            <LiquidSwitch checked={checked} onCheckedChange={onChange} />
          </div>
        ))}
      </div>
    </GlassStage>
  );
}

// ─── Imperative ref (toggle()) ─────────────────────────────────────────────

export function LiquidSwitchRefDemo() {
  const [log, setLog] = useState<string[]>([]);

  return (
    <GlassStage tall>
      <LiquidSwitch
        defaultChecked={false}
        onCheckedChange={(checked) =>
          setLog((prev) => [`changed → ${checked}`, ...prev].slice(0, 4))
        }
      />
      <div
        className="w-full max-w-xs rounded-lg p-3 text-xs font-mono"
        style={{
          background: 'rgba(0,0,0,0.3)',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        {log.length === 0 ? (
          <span className="opacity-50">toggle the switch…</span>
        ) : (
          log.map((entry, i) => <div key={i}>{entry}</div>)
        )}
      </div>
    </GlassStage>
  );
}

// ─── Glass options demo ─────────────────────────────────────────────────────

export function LiquidSwitchGlassDemo() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [c, setC] = useState(false);

  return (
    <GlassStage tall>
      <div className="flex flex-wrap items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <LiquidSwitch
            checked={a}
            onCheckedChange={setA}
            options={{ refractiveIndex: 1.2, specularSlope: 0.3 }}
          />
          <span className="text-xs text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            Subtle
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LiquidSwitch checked={b} onCheckedChange={setB} />
          <span className="text-xs text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            Default
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LiquidSwitch
            checked={c}
            onCheckedChange={setC}
            options={{
              refractiveIndex: 2.0,
              specularSlope: 1,
              bezelWidth: 32,
            }}
          />
          <span className="text-xs text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            Intense
          </span>
        </div>
      </div>
    </GlassStage>
  );
}
