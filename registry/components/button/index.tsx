'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  createLiquidButton,
  LiquidButtonEventMap,
  LiquidButtonHandle,
  LiquidButtonOptions,
} from '@avenra/liquid-glass';

/**
 * Fully type-safe event handler mapping
 */
type LiquidButtonEvents = {
  [K in keyof LiquidButtonEventMap]?: (event: LiquidButtonEventMap[K]) => void;
};

export interface LiquidButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> {
  label: string;
  options?: LiquidButtonOptions;
  events?: LiquidButtonEvents;
}

export const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ label, options, events, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const handleRef = useRef<LiquidButtonHandle | null>(null);

    useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    /**
     * Initialize + cleanup lifecycle
     */
    useEffect(() => {
      if (!buttonRef.current) return;

      handleRef.current = createLiquidButton(buttonRef.current, {
        label,
        ...options,
      });

      return () => {
        handleRef.current?.destroy();
        handleRef.current = null;
      };
    }, []);

    /**
     * Sync label updates
     */
    useEffect(() => {
      handleRef.current?.setLabel(label);
    }, [label]);

    /**
     * Strictly typed event binding (no unsafe iteration tricks)
     */
    useEffect(() => {
      if (!handleRef.current || !events) return;
      (Object.keys(events) as (keyof LiquidButtonEventMap)[]).forEach((event) => {
        const handler = events[event];

        if (handler) {
          handleRef.current?.on(event, handler as (e: LiquidButtonEventMap[typeof event]) => void);
        }
      });

      return () => {
        if (!handleRef.current || !events) return;
        (Object.keys(events) as (keyof LiquidButtonEventMap)[]).forEach((event) => {
          handleRef.current?.off?.(event);
        });
      };
    }, [events]);

    return <button ref={buttonRef} {...props} />;
  },
);

LiquidButton.displayName = 'LiquidButton';
