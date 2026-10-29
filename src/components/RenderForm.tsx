/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Loader2, ShieldCheck, AlertCircle, Lock, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { ImageUploadZone } from './ImageUploadZone.js';
import { MASTER_EXTREME_REALISM_PROMPT } from '../lib/prompt.js';

interface RenderFormProps {
  imagePreview: string | null;
  mimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  isRendering: boolean;
  renderingStage: string | null;
  errorMessage: string | null;
  onImageSelected: (base64: string, mime: string, name: string, size: number) => void;
  onImageCleared: () => void;
  onSubmitRender: () => void;
}

export const RenderForm: React.FC<RenderFormProps> = ({
  imagePreview,
  mimeType,
  fileName,
  fileSize,
  isRendering,
  renderingStage,
  errorMessage,
  onImageSelected,
  onImageCleared,
  onSubmitRender,
}) => {
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const canRender = Boolean(imagePreview && !isRendering);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canRender) {
      onSubmitRender();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Extreme Photorealism & Design Lock Active Badge */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 text-white p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-xs tracking-wide uppercase text-neutral-100">
                Extreme Photorealism | Absolute Design &amp; Element Lock
              </span>
              <p className="text-[11px] text-neutral-400">
                100% Geometri, dimensi, fasad, material, dan sudut kamera dikunci total. Hanya realisme visual yang ditingkatkan.
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium shrink-0">
            Prompt Otomatis Aktif
          </span>
        </div>

        {/* Accordion to view the exact active prompt */}
        <div className="pt-1 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={() => setShowPromptDetails(!showPromptDetails)}
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-500" />
            <span>Lihat Prompt Master Ekstrem Fotorealisme yang digunakan</span>
            {showPromptDetails ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {showPromptDetails && (
            <div className="mt-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap select-all">
              {MASTER_EXTREME_REALISM_PROMPT}
            </div>
          )}
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
          className={`w-full relative flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
            canRender
              ? 'bg-neutral-950 text-white hover:bg-neutral-800 active:scale-[0.99] shadow-md cursor-pointer'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {isRendering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              <span>{renderingStage || 'Memproses Fotorealisme Ekstrem...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Render Image (Extreme Photorealism)</span>
            </>
          )}
        </button>

        {!imagePreview && (
          <p className="text-center text-[11px] text-neutral-500 mt-2">
            Unggah gambar arsitektur Anda di atas untuk menjalankan peningkatan fotorealisme ekstrem.
          </p>
        )}
      </div>
    </form>
  );
};
