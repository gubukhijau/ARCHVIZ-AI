/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Download,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sliders,
  Info,
  Calendar,
} from 'lucide-react';
import { RenderJob, PRESETS } from '../types/index.js';
import { ComparisonSlider } from './ComparisonSlider.js';

interface ResultViewProps {
  job: RenderJob;
  onBackToStudio: () => void;
  onReRender: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  job,
  onBackToStudio,
  onReRender,
}) => {
  const preset = PRESETS[job.lighting_preset] || PRESETS.siang;

  const handleDownload = () => {
    if (!job.rendered_url) return;
    const link = document.createElement('a');
    link.href = job.rendered_url;
    link.download = `archviz_${job.lighting_preset}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formattedDate = job.completed_at
    ? new Date(job.completed_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : new Date(job.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToStudio}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <span className="text-neutral-300">/</span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Hasil Render Selesai</span>
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Perbandingan interaktif render asli vs peningkatan fotorealistis AI.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReRender}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Render Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Hasil</span>
          </button>
        </div>
      </div>

      {/* Comparison Slider */}
      {job.original_url && job.rendered_url && (
        <ComparisonSlider
          originalUrl={job.original_url}
          renderedUrl={job.rendered_url}
          originalLabel="Render Asli (Source)"
          renderedLabel={`Peningkatan Fotorealistis (${preset.title})`}
        />
      )}

      {/* Metadata & Technical Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl border border-neutral-200 bg-white">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Sliders className="w-3.5 h-3.5 text-neutral-400" />
            <span>Preset Pencahayaan</span>
          </div>
          <p className="text-sm font-semibold text-neutral-900">{preset.title}</p>
          <p className="text-[11px] text-neutral-500">{preset.tagline}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Waktu Simulasi Matahari</span>
          </div>
          <p className="text-sm font-semibold text-neutral-900">{preset.timeTag}</p>
          <p className="text-[11px] text-neutral-500">Global Illumination & Contact Shadows</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>Status & Waktu Selesai</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Completed
            </span>
            <span className="text-xs text-neutral-600 font-mono">{formattedDate}</span>
          </div>
          <p className="text-[11px] text-neutral-500">ID: {job.id.slice(0, 8)}...</p>
        </div>
      </div>

      {job.additional_instructions && (
        <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs space-y-1">
          <p className="font-semibold text-neutral-700">Instruksi Tambahan yang Diterapkan:</p>
          <p className="text-neutral-600 italic">"{job.additional_instructions}"</p>
        </div>
      )}

      {/* Photographic Realism Disclosure Notice */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 text-xs leading-relaxed">
        <Info className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" />
        <p>
          <strong>Catatan Pelestarian Desain:</strong> ARCHVIZ AI mengoptimalkan respons fotometrik,
          roughness material, pantulan optik, dan bayangan kontak berdasarkan referensi tunggal gambar asli Anda.
          Meskipun instruksi pelestarian geometri sangat ketat, model generasi gambar berbasis difusi dapat
          menampilkan variasi mikro pada detail tepi atau pantulan halus, dan tidak mengklaim presisi geometris CAD piksel-sempurna 100%.
        </p>
      </div>
    </div>
  );
};
