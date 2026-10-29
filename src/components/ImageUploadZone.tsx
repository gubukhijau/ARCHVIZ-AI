/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, RefreshCw, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ImageUploadZoneProps {
  imagePreview: string | null;
  mimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  onImageSelected: (base64: string, mime: string, name: string, size: number) => void;
  onImageCleared: () => void;
  disabled?: boolean;
}

// Built-in curated sample architectural renders for fast testing
const SAMPLE_ARCHITECTURAL_IMAGES = [
  {
    name: 'Modern Pavilion (Sketch/Clay)',
    tag: 'Exterior Clay Render',
    // High quality modern minimalist pavilion
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Brutalist Concrete House',
    tag: 'Geometric Concrete',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Glass Villa Overlook',
    tag: 'Curtain Wall Facade',
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  },
];

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  imagePreview,
  fileName,
  fileSize,
  onImageSelected,
  onImageCleared,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);

  const validateAndProcessFile = useCallback(
    (file: File) => {
      setErrorMessage(null);

      // Validate MIME type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setErrorMessage('Format berkas tidak didukung. Harap gunakan file PNG, JPG, JPEG, atau WEBP.');
        return;
      }

      // Max size: 25MB
      const maxBytes = 25 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErrorMessage('Ukuran file melebihi batas 25MB. Silakan kompres atau pilih gambar lebih kecil.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) {
          setErrorMessage('Gagal membaca gambar. Silakan coba lagi.');
          return;
        }

        // Verify valid image by loading into Image object
        const img = new Image();
        img.onload = () => {
          const maxDim = 2048;
          let width = img.width;
          let height = img.height;

          // If image exceeds 2048px on longest side, scale preserving exact aspect ratio
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              const resizedDataUrl = canvas.toDataURL(outputMime, 0.92);
              onImageSelected(resizedDataUrl, outputMime, file.name, file.size);
              return;
            }
          }

          onImageSelected(result, file.type, file.name, file.size);
        };
        img.onerror = () => {
          setErrorMessage('Berkas bukan gambar yang valid atau rusak.');
        };
        img.src = result;
      };

      reader.onerror = () => {
        setErrorMessage('Terjadi kesalahan saat membaca file.');
      };

      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateAndProcessFile(e.dataTransfer.files[0]);
      }
    },
    [disabled, validateAndProcessFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
    // reset input value so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = async (sampleUrl: string, sampleName: string) => {
    setIsLoadingSample(true);
    setErrorMessage(null);
    try {
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const file = new File([blob], `${sampleName.toLowerCase().replace(/\s+/g, '_')}.jpg`, {
        type: 'image/jpeg',
      });
      validateAndProcessFile(file);
    } catch {
      setErrorMessage('Gagal memuat sampel arsitektur. Anda dapat mengunggah file Anda sendiri.');
    } finally {
      setIsLoadingSample(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
          Unggah Gambar Arsitektur
        </label>
        <span className="text-[11px] text-neutral-500">Maksimal 25MB · PNG, JPG, WEBP</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Box or Image Preview */}
      {!imagePreview ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            dragActive
              ? 'border-neutral-900 bg-neutral-100/80 scale-[0.99]'
              : 'border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3.5 rounded-full bg-neutral-100 text-neutral-700 group-hover:scale-105 group-hover:bg-neutral-200 transition-all">
              <Upload className="w-6 h-6 stroke-[1.8]" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-900">
                Tarik & letakkan gambar arsitektur Anda di sini, atau
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={disabled}
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-200 shadow-xs transition-colors"
              >
                Pilih Gambar
              </button>
            </div>

            <p className="text-[11px] text-neutral-500 max-w-sm">
              Rendering 3D, sketsa SketchUp/Revit, model clay, atau foto fasad eksisting. Rasio aspek asli akan dipertahankan.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl border border-neutral-200 bg-neutral-900 overflow-hidden">
          {/* Action Overlay Header */}
          <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
            <div className="flex items-center gap-2 text-xs text-white drop-shadow-sm truncate pr-2">
              <ImageIcon className="w-4 h-4 shrink-0 text-neutral-300" />
              <span className="font-medium truncate">{fileName || 'architectural_render'}</span>
              {fileSize && (
                <span className="text-[11px] text-neutral-300 font-mono">
                  ({formatFileSize(fileSize)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-md transition-colors disabled:opacity-50"
                title="Ganti gambar"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Ganti</span>
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={onImageCleared}
                className="p-1 text-white bg-red-500/80 hover:bg-red-600/90 backdrop-blur-md rounded-md transition-colors disabled:opacity-50"
                title="Hapus gambar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Aspect-Preserving Image Container */}
          <div className="flex items-center justify-center max-h-[380px] min-h-[220px] p-2 bg-neutral-950">
            <img
              src={imagePreview}
              alt="Architectural source preview"
              className="max-h-[360px] w-auto max-w-full object-contain rounded-md"
            />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Samples Bar for Instant Evaluation */}
      {!imagePreview && (
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-neutral-400" />
              Atau coba render contoh arsitektur:
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_ARCHITECTURAL_IMAGES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                disabled={disabled || isLoadingSample}
                onClick={() => handleLoadSample(sample.url, sample.name)}
                className="flex items-center gap-2.5 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-left transition-colors cursor-pointer group"
              >
                <img
                  src={sample.url}
                  alt={sample.name}
                  className="w-10 h-10 rounded object-cover border border-neutral-200 group-hover:brightness-95"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-neutral-900 truncate">
                    {sample.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate">{sample.tag}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
