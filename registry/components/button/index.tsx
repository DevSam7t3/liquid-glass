'use client';

import React, { useEffect, useRef } from 'react';
import { createLiquidButton, LiquidButtonHandle } from '@avenra/liquid-glass';

interface Props {
  label: string;
  onClick?: () => void;
}

export const LiquidButton: React.FC<Props> = ({ label, onClick }) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const handleRef = useRef<LiquidButtonHandle | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      // 1. Initialize the component
      handleRef.current = createLiquidButton(containerRef.current, { label });

      // 2. Wire up events
      if (onClick) {
        handleRef.current.on('click', onClick);
      }
    }

    // 3. Cleanup on unmount
    return () => {
      handleRef.current?.destroy();
    };
  }, [onClick]); // Re-run if onClick handler changes

  // Update label if it changes
  useEffect(() => {
    handleRef.current?.setLabel(label);
  }, [label]);

  return <button ref={containerRef} />;
};
