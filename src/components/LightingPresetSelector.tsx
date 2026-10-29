/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Sunrise, Sunset, Moon, Check } from 'lucide-react';
import { LightingPreset, PRESETS } from '../types/index.js';

interface LightingPresetSelectorProps {
  selected: LightingPreset;
  onSelect: (preset: LightingPreset) => void;
  disabled?: boolean;
}

export const LightingPresetSelector: React.FC<LightingPresetSelectorProps> = ({
  selected,
  onSelect,
  disabled = false,
}) => {
  const getIcon = (id: LightingPreset) => {
    switch (id) {
      case 'pagi':
        return <Sunrise className="w-5 h-5 text-amber-600" />;
      case 'siang':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'sore':
        return <Sunset className="w-5 h-5 text-orange-600" />;
      case 'malam':
        return <Moon className="w-5 h-5 text-indigo-500" />;
    }
  };

  const presetList = Object.values(PRESETS);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
          Preset Pencahayaan & Waktu
        </label>
        <span className="text-[11px] text-neutral-500">Pilih 1 preset</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {presetList.map((preset) => {
          const isSelected = selected === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(preset.id)}
              className={`relative flex flex-col text-left p-3.5 rounded-xl border transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-950 text-white shadow-sm ring-1 ring-neutral-900'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/70 text-neutral-900'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isSelected ? 'bg-neutral-800' : 'bg-neutral-100'
                  }`}
                >
                  {getIcon(preset.id)}
                </div>
                {isSelected ? (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-neutral-950">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-600">
                    {preset.timeTag.split(' ')[0]}
                  </span>
                )}
              </div>

              <div className="font-semibold text-sm tracking-tight mb-0.5">
                {preset.title}
              </div>
              <div
                className={`text-[11px] font-mono mb-1.5 ${
                  isSelected ? 'text-neutral-300' : 'text-neutral-600'
                }`}
              >
                {preset.timeTag}
              </div>

              <div
                className={`text-[11px] leading-relaxed line-clamp-2 ${
                  isSelected ? 'text-neutral-300' : 'text-neutral-600'
                }`}
              >
                {preset.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
