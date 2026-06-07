'use client';

import * as React from 'react';
import {
  createLiquidSwitch,
  type LiquidSwitchHandle,
  type LiquidSwitchOptions,
  type LiquidSwitchEventMap,
} from '@avenra/liquid-glass';

export interface LiquidSwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Controlled state */
  checked?: boolean;
  /** Default state for uncontrolled usage */
  defaultChecked?: boolean;
  /** Called when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Pass-through options for the underlying library */
  options?: LiquidSwitchOptions;
}

export const LiquidSwitch = React.forwardRef<LiquidSwitchHandle | null, LiquidSwitchProps>(
  ({ checked, defaultChecked = false, onCheckedChange, options, className, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const instanceRef = React.useRef<LiquidSwitchHandle | null>(null);

    const isControlled = checked !== undefined;

    // Initialize component
    React.useEffect(() => {
      if (!containerRef.current) return;
      if (instanceRef.current) return;
      if (containerRef.current.children.length > 0) return;

      const instance = createLiquidSwitch(containerRef.current, {
        checked: checked ?? defaultChecked,
        ...options,
      });

      instanceRef.current = instance;

      const handleChange = (payload: LiquidSwitchEventMap['change']) => {
        onCheckedChange?.(payload.checked);
      };

      instance.on('change', handleChange);

      return () => {
        instance.off('change', handleChange);
        instance.destroy();
        instanceRef.current = null;
      };
    }, []);

    // Sync controlled state
    React.useEffect(() => {
      if (!instanceRef.current || !isControlled) return;
      instanceRef.current.checked = checked!;
    }, [checked, isControlled]);

    // Expose imperative API
    React.useImperativeHandle(ref, () => instanceRef.current!, []);

    return <div ref={containerRef} className={className} {...props} />;
  },
);

LiquidSwitch.displayName = 'LiquidSwitch';
