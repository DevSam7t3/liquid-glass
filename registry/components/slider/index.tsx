'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  createLiquidSlider,
  LiquidSliderHandle,
  LiquidSliderEventMap,
  LiquidSliderOptions,
} from '@avenra/liquid-glass';

export interface LiquidSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  min: number;
  max: number;
  value: number;
  options?: LiquidSliderOptions;
  events?: {
    [K in keyof LiquidSliderEventMap]?: (payload: LiquidSliderEventMap[K]) => void;
  };
}

export const LiquidSlider = forwardRef<HTMLDivElement, LiquidSliderProps>(
  ({ min, max, value, options, events, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<LiquidSliderHandle | null>(null);

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    useEffect(() => {
      if (!containerRef.current) return;

      if (containerRef.current.children.length > 0) return; // already initialized

      handleRef.current = createLiquidSlider(containerRef.current, {
        min,
        max,
        value,
        blur: 0,
        ...options,
      });

      return () => {
        handleRef.current?.destroy();
        handleRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (!handleRef.current) return;

      handleRef.current.value = value;
    }, [value]);

    useEffect(() => {
      if (!handleRef.current) return;

      handleRef.current.value = Math.min(Math.max(value, min), max);
    }, [min, max]);

    useEffect(() => {
      if (!handleRef.current || !events) return;

      const handle = handleRef.current;

      for (const key in events) {
        const event = key as keyof LiquidSliderEventMap;
        const handler = events[event];

        if (handler) {
          handle.on(event, handler as (payload: LiquidSliderEventMap[typeof event]) => void);
        }
      }

      return () => {
        if (!handleRef.current || !events) return;

        const handle = handleRef.current;

        for (const key in events) {
          const event = key as keyof LiquidSliderEventMap;
          const handler = events[event];

          if (handler) {
            handle.off(event, handler as (payload: LiquidSliderEventMap[typeof event]) => void);
          }
        }
      };
    }, [events]);

    return <div ref={containerRef} {...props} />;
  },
);

LiquidSlider.displayName = 'LiquidSlider';
