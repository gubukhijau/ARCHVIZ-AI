/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { LightingPreset } from '../types/index.js';
import { ImageUploadZone } from './ImageUploadZone.js';
import { LightingPresetSelector } from './LightingPresetSelector.js';

interface RenderFormProps {
  imagePreview: string | null;
  mimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  selectedPreset: LightingPreset;
  additionalInstructions: string;
  engine: 'free' | 'gemini';
  isRendering: boolean;
  renderingStage: string | null;
  errorMessage: string | null;
  onImageSelected: (base64: string, mime: string, name: string, size: number) => void;
  onImageCleared: () => void;
  onPresetSelect: (preset: LightingPreset) => void;
  onInstructionsChange: (val: string) => void;
  onEngineChange: (engine: 'free' | 'gemini') => void;
  onSubmitRender: () => void;
}

export const RenderForm: React.FC<RenderFormProps> = ({
  imagePreview,
  mimeType,
  fileName,
  fileSize,
  selectedPreset,
  additionalInstructions,
  engine,
  isRendering,
  renderingStage,
  errorMessage,
  onImageSelected,
  onImageCleared,
  onPresetSelect,
  onInstructionsChange,
  onEngineChange,
  onSubmitRender,
}) => {
  const canRender = Boolean(imagePreview && !isRendering);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canRender) {
      onSubmitRender();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Engine Mode Selection */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
            Model Engine AI
          </label>
          <span className="text-[11px] text-neutral-500">Pilih mesin render</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isRendering}
            onClick={() => onEngineChange('free')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              engine === 'free'
                ? 'border-neutral-900 bg-neutral-950 text-white shadow-xs ring-1 ring-neutral-900'
                : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Fotorealisme AI (Gratis)
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  engine === 'free' ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                Hasil Maksimal
              </span>
            </div>
            <p
              className={`text-[11px] leading-relaxed ${
                engine === 'free' ? 'text-neutral-300' : 'text-neutral-500'
              }`}
            >
              Gemini 3.8 Vision + FLUX Arsitektur. Tanpa batas kuota, mempertahankan geometri asli.
            </p>
          </button>

          <button
            type="button"
            disabled={isRendering}
            onClick={() => onEngineChange('gemini')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              engine === 'gemini'
                ? 'border-neutral-900 bg-neutral-950 text-white shadow-xs ring-1 ring-neutral-900'
                : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Gemini Direct (Paid Key)
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  engine === 'gemini' ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                gemini-3.1-image
              </span>
            </div>
            <p
              className={`text-[11px] leading-relaxed ${
                engine === 'gemini' ? 'text-neutral-300' : 'text-neutral-500'
              }`}
            >
              Model visual editing Google. Memerlukan akun berbayar aktif di Google AI Studio.
            </p>
          </button>
        </div>
      </div>

      {/* 1. Upload Section */}
      <ImageUploadZone
        imagePreview={imagePreview}
        mimeType={mimeType}
        fileName={fileName}
        fileSize={fileSize}
        onImageSelected={onImageSelected}
        onImageCleared={onImageCleared}
        disabled={isRendering}
      />

      {/* 2. Preset Selection */}
      <LightingPresetSelector
        selected={selectedPreset}
        onSelect={onPresetSelect}
        disabled={isRendering}
      />

      {/* 3. Additional Instructions */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="instructions"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-700"
          >
            Keterangan Tambahan <span className="font-normal text-neutral-500">(Opsional)</span>
          </label>
          <span className="text-[11px] text-neutral-500">
            {additionalInstructions.length}/500 karakter
          </span>
        </div>

        <textarea
          id="instructions"
          rows={3}
          maxLength={500}
          disabled={isRendering}
          value={additionalInstructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder="Tambahkan instruksi pencahayaan atau detail realisme... (contoh: 'Perkuat pantulan kaca jendela saat senja' atau 'Tambahkan aksen pantulan basah halus di paving')"
          className="w-full px-3.5 py-2.5 text-xs text-neutral-900 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:cursor-not-allowed"
        />

        <div className="flex items-start gap-1.5 text-[11px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
          <span>
            Aturan pelestarian desain arsitektur selalu diutamakan. Instruksi tambahan hanya mempengaruhi nuansa pencahayaan dan respons fotorealistis tanpa mengubah struktur.
          </span>
        </div>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Proses Render Gagal</p>
            <p className="text-red-700 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Render Action Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!canRender}
          className={`w-full relative flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-medium text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
            canRender
              ? 'bg-neutral-950 text-white hover:bg-neutral-800 active:scale-[0.99] shadow-sm cursor-pointer'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {isRendering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              <span>{renderingStage || 'Memproses Render Arsitektur...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Render Image</span>
            </>
          )}
        </button>

        {!imagePreview && (
          <p className="text-center text-[11px] text-neutral-500 mt-2">
            Unggah atau pilih sampel gambar arsitektur di atas untuk mengaktifkan tombol render.
          </p>
        )}
      </div>
    </form>
  );
};
