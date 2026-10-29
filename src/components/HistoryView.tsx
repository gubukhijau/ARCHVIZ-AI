/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Clock,
  Sliders,
  AlertCircle,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { RenderJob, PRESETS, LightingPreset } from '../types/index.js';

interface HistoryViewProps {
  jobs: RenderJob[];
  onSelectJob: (job: RenderJob) => void;
  onGoToStudio: () => void;
  isLoading?: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  jobs,
  onSelectJob,
  onGoToStudio,
  isLoading = false,
}) => {
  const [filterPreset, setFilterPreset] = useState<string>('all');

  const filteredJobs = jobs.filter((job) => {
    if (filterPreset === 'all') return true;
    return job.lighting_preset === filterPreset;
  });

  const handleDownload = (e: React.MouseEvent, job: RenderJob) => {
    e.stopPropagation();
    const url = job.rendered_url || job.original_url;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `archviz_${job.lighting_preset}_${job.id.slice(0, 6)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Riwayat Render Arsitektur</h2>
          <p className="text-xs text-neutral-500">
            Daftar sesi peningkatan fotorealisme yang telah selesai dan tersimpan.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="inline-flex items-center gap-1 p-1 bg-neutral-100 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilterPreset('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterPreset === 'all'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Semua ({jobs.length})
          </button>
          {(['pagi', 'siang', 'sore', 'malam'] as LightingPreset[]).map((p) => {
            const count = jobs.filter((j) => j.lighting_preset === p).length;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setFilterPreset(p)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  filterPreset === p
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {p} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-neutral-200 bg-neutral-100 animate-pulse"
            />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-neutral-300 bg-white space-y-3">
          <div className="p-3 rounded-full bg-neutral-100 text-neutral-400">
            <Inbox className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-neutral-900">Belum Ada Riwayat Render</p>
            <p className="text-xs text-neutral-500 max-w-sm">
              Mulai studio dengan mengunggah gambar arsitektur Anda untuk melihat peningkatan fotorealisme di sini.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToStudio}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Mulai Render Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const preset = PRESETS[job.lighting_preset] || PRESETS.siang;
            const displayImage = job.rendered_url || job.original_url;
            const formattedDate = new Date(job.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="group relative flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden hover:border-neutral-400 hover:shadow-sm transition-all cursor-pointer"
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-[16/10] w-full bg-neutral-950 overflow-hidden">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={preset.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-neutral-500 text-xs">
                      No Image
                    </div>
                  )}

                  {/* Preset Overlay Tag */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white bg-black/60 backdrop-blur-md rounded border border-white/10 uppercase">
                    {preset.title}
                  </div>

                  {/* Status indicator */}
                  <div className="absolute top-2.5 right-2.5">
                    {job.status === 'completed' && (
                      <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-300 bg-emerald-950/80 backdrop-blur-md rounded border border-emerald-500/30">
                        Selesai
                      </span>
                    )}
                    {job.status === 'processing' && (
                      <span className="px-2 py-0.5 text-[10px] font-medium text-amber-300 bg-amber-950/80 backdrop-blur-md rounded border border-amber-500/30">
                        Memproses
                      </span>
                    )}
                    {job.status === 'failed' && (
                      <span className="px-2 py-0.5 text-[10px] font-medium text-red-300 bg-red-950/80 backdrop-blur-md rounded border border-red-500/30">
                        Gagal
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-900">{preset.title}</span>
                      <span className="text-[11px] font-mono text-neutral-600">
                        {formattedDate}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 line-clamp-1">
                      {preset.tagline}
                    </p>
                  </div>

                  {job.status === 'failed' && job.error_message && (
                    <div className="flex items-center gap-1.5 text-[10px] text-red-600 bg-red-50 p-1.5 rounded">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{job.error_message}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 group-hover:text-black">
                      <span>Buka Hasil</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>

                    {job.rendered_url && (
                      <button
                        type="button"
                        onClick={(e) => handleDownload(e, job)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                        title="Unduh hasil render"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
