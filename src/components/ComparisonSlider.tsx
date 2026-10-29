/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeftRight, Maximize2, Minimize2, Eye } from 'lucide-react';

interface ComparisonSliderProps {
  originalUrl: string;
  renderedUrl: string;
  originalLabel?: string;
  renderedLabel?: string;
  aspectRatioClass?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalUrl,
  renderedUrl,
  originalLabel = 'Original 3D / Wireframe',
  renderedLabel = 'Photorealistic Render',
  aspectRatioClass = 'aspect-[16/10]',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'rendered-only'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
      setSliderPosition(percentage);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="w-full space-y-3">
      {/* View controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              viewMode === 'slider'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Slider Split
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Berdampingan
          </button>
          <button
            type="button"
            onClick={() => setViewMode('rendered-only')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              viewMode === 'rendered-only'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Hasil Penuh
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'Tutup Penuh' : 'Layar Penuh'}</span>
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`relative select-none overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900 transition-all ${
          isFullscreen
            ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl flex flex-col justify-center items-center bg-black/95 p-4'
            : `w-full ${aspectRatioClass}`
        }`}
      >
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full gap-2 p-2">
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-neutral-950 flex flex-col">
              <div className="absolute top-3 left-3 z-10 px-2 py-1 text-[11px] font-medium tracking-wide text-neutral-300 bg-black/60 backdrop-blur-md rounded border border-white/10">
                {originalLabel}
              </div>
              <img
                src={originalUrl}
                alt="Original source"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-neutral-950 flex flex-col">
              <div className="absolute top-3 left-3 z-10 px-2 py-1 text-[11px] font-medium tracking-wide text-neutral-100 bg-emerald-950/70 backdrop-blur-md rounded border border-emerald-500/30">
                {renderedLabel}
              </div>
              <img
                src={renderedUrl}
                alt="Photorealistic result"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ) : viewMode === 'rendered-only' ? (
          <div className="relative w-full h-full bg-neutral-950 flex items-center justify-center">
            <div className="absolute top-3 left-3 z-10 px-2 py-1 text-[11px] font-medium tracking-wide text-neutral-100 bg-black/60 backdrop-blur-md rounded border border-white/10">
              {renderedLabel}
            </div>
            <img
              src={renderedUrl}
              alt="Photorealistic render"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          /* Slider Split Mode */
          <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden cursor-ew-resize touch-none flex items-center justify-center"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            {/* Background Layer: Photorealistic Render (Right/Bottom revealed) */}
            <img
              src={renderedUrl}
              alt="Photorealistic Render"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Foreground Layer: Original Image (Clipped) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPosition}%` }}
            >
              <div
                className="relative h-full"
                style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
              >
                <img
                  src={originalUrl}
                  alt="Original Image"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-3 left-3 pointer-events-none z-10 px-2.5 py-1 text-[11px] font-medium text-neutral-200 bg-black/60 backdrop-blur-md rounded border border-white/10">
              {originalLabel}
            </div>
            <div className="absolute bottom-3 right-3 pointer-events-none z-10 px-2.5 py-1 text-[11px] font-medium text-neutral-200 bg-black/60 backdrop-blur-md rounded border border-white/10">
              {renderedLabel}
            </div>

            {/* Divider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white text-neutral-900 shadow-lg border border-neutral-300">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {viewMode === 'slider' && (
        <p className="text-center text-[11px] text-neutral-600">
          Geser garis pembagi ke kiri atau kanan untuk membandingkan foto asli dengan hasil render fotorealistis.
        </p>
      )}
    </div>
  );
};
