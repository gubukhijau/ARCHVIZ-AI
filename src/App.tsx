/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  History,
  Layers,
  User,
  ExternalLink,
  ShieldAlert,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { LightingPreset, RenderJob } from './types/index.js';
import { RenderForm } from './components/RenderForm.js';
import { ResultView } from './components/ResultView.js';
import { HistoryView } from './components/HistoryView.js';
import { AuthModal } from './components/AuthModal.js';
import { getSupabaseBrowserClient } from './lib/supabase.js';

export default function App() {
  // Navigation tabs: 'studio' | 'result' | 'history'
  const [currentView, setCurrentView] = useState<'studio' | 'result' | 'history'>('studio');

  // Studio Form State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<LightingPreset>('siang');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
  const [engine, setEngine] = useState<'openai' | 'free' | 'gemini'>('openai');

  // Processing & Job State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderingStage, setRenderingStage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<RenderJob | null>(null);
  const [historyJobs, setHistoryJobs] = useState<RenderJob[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Initialize Supabase Auth listener & History load
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({ email: session.user.email, id: session.user.id });
          setAuthToken(session.access_token);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({ email: session.user.email, id: session.user.id });
          setAuthToken(session.access_token);
        } else {
          setUser(null);
          setAuthToken(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local demo session check
      const savedUser = localStorage.getItem('archviz_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Fetch history jobs from server
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/history', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.jobs)) {
          setHistoryJobs(data.jobs);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleImageSelected = (base64: string, mime: string, name: string, size: number) => {
    setImagePreview(base64);
    setMimeType(mime);
    setFileName(name);
    setFileSize(size);
    setErrorMessage(null);
  };

  const handleImageCleared = () => {
    setImagePreview(null);
    setMimeType(null);
    setFileName(null);
    setFileSize(null);
    setErrorMessage(null);
  };

  // Submit Render
  const handleSubmitRender = async () => {
    if (!imagePreview) return;

    setIsRendering(true);
    setErrorMessage(null);
    setRenderingStage('Mengunggah & memvalidasi referensi arsitektur...');

    // Progress feedback transitions
    const stageTimer1 = setTimeout(() => {
      setRenderingStage('Menganalisis geometri, bukaan & material eksisting...');
    }, 2500);

    const stageTimer2 = setTimeout(() => {
      setRenderingStage('Menerapkan simulasi pencahayaan & global illumination...');
    }, 5500);

    const stageTimer3 = setTimeout(() => {
      setRenderingStage('Menyempurnakan microtexture, roughness, dan pantulan optik...');
    }, 9000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/render', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageData: imagePreview,
          mimeType: mimeType || 'image/png',
          preset: selectedPreset,
          additionalInstructions: additionalInstructions.trim() || undefined,
          engine,
        }),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        if (data?.error) {
          throw new Error(data.error);
        }
        if (response.status === 429) {
          throw new Error(
            'Batas kuota Gemini Free Tier tercapai (limit 0 untuk model generasi gambar). Silakan hubungkan Paid API Key di Google AI Studio atau coba beberapa saat lagi.'
          );
        }
        if (response.status === 502 || response.status === 504) {
          throw new Error(
            `Koneksi backend (${response.status}). Proses rendering gambar AI memerlukan kuota aktif atau waktu lebih. Silakan coba kembali.`
          );
        }
        const text = await response.text();
        throw new Error(
          text && !text.includes('<!doctype')
            ? text.slice(0, 160)
            : `Gagal memproses render (HTTP ${response.status}).`
        );
      }

      if (data && data.job) {
        setCurrentJob(data.job);
        setHistoryJobs((prev) => [data.job, ...prev]);
        setCurrentView('result');
      } else {
        throw new Error(data?.error || 'Hasil render tidak ditemukan dalam respon server.');
      }
    } catch (err: any) {
      console.error('Render error:', err);
      setErrorMessage(
        err?.message || 'Terjadi kesalahan pada mesin render. Silakan coba kembali.'
      );
    } finally {
      setIsRendering(false);
      setRenderingStage(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 text-neutral-900 font-sans flex flex-col antialiased selection:bg-neutral-900 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('studio')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-950 text-white shadow-xs group-hover:bg-neutral-800 transition-colors">
                <Building2 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wider uppercase text-neutral-950">
                  ARCHVIZ AI
                </span>
                <span className="block text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                  Architectural Render Studio
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setCurrentView('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'studio'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>

            {currentJob && (
              <button
                type="button"
                onClick={() => setCurrentView('result')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'result'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hasil Render</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                fetchHistory();
                setCurrentView('history');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'history'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat</span>
              {historyJobs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-700">
                  {historyJobs.length}
                </span>
              )}
            </button>

            <div className="h-4 w-px bg-neutral-200 mx-1" />

            {/* Auth Button */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 border border-neutral-200 bg-white transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[100px] truncate hidden sm:inline">
                {user ? user.email?.split('@')[0] : 'Akun'}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentView === 'studio' && (
          <div className="space-y-6">
            {/* Studio Header Banner */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                  Studio Peningkatan Fotorealisme Arsitektur
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl">
                  Tingkatkan gambar model 3D, wireframe, atau foto mentah menjadi rendering fotorealistis.
                  Geometri bangunan, material asli, dan komposisi kamera dipertahankan sepenuhnya.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white px-3 py-2 rounded-xl border border-neutral-200 shadow-2xs">
                <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Redesign · Pelestarian Desain Asli</span>
              </div>
            </div>

            {/* Render Form Container */}
            <div className="max-w-3xl mx-auto bg-white border border-neutral-200 rounded-2xl p-5 sm:p-7 shadow-xs">
              <RenderForm
                imagePreview={imagePreview}
                mimeType={mimeType}
                fileName={fileName}
                fileSize={fileSize}
                selectedPreset={selectedPreset}
                additionalInstructions={additionalInstructions}
                engine={engine}
                isRendering={isRendering}
                renderingStage={renderingStage}
                errorMessage={errorMessage}
                onImageSelected={handleImageSelected}
                onImageCleared={handleImageCleared}
                onPresetSelect={setSelectedPreset}
                onInstructionsChange={setAdditionalInstructions}
                onEngineChange={setEngine}
                onSubmitRender={handleSubmitRender}
              />
            </div>
          </div>
        )}

        {currentView === 'result' && currentJob && (
          <div className="max-w-5xl mx-auto bg-white border border-neutral-200 rounded-2xl p-5 sm:p-7 shadow-xs">
            <ResultView
              job={currentJob}
              onBackToStudio={() => setCurrentView('studio')}
              onReRender={() => setCurrentView('studio')}
            />
          </div>
        )}

        {currentView === 'history' && (
          <div className="max-w-5xl mx-auto bg-white border border-neutral-200 rounded-2xl p-5 sm:p-7 shadow-xs">
            <HistoryView
              jobs={historyJobs}
              isLoading={isLoadingHistory}
              onSelectJob={(job) => {
                setCurrentJob(job);
                setCurrentView('result');
              }}
              onGoToStudio={() => setCurrentView('studio')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">ARCHVIZ AI</span>
            <span>·</span>
            <span>Architectural Photo Realism Studio</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-neutral-400">Powered by Gemini Visual Editing & Supabase</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onUserChanged={(newUser, token) => {
          setUser(newUser);
          setAuthToken(token || null);
          if (newUser) {
            localStorage.setItem('archviz_user', JSON.stringify(newUser));
          } else {
            localStorage.removeItem('archviz_user');
          }
          fetchHistory();
        }}
      />
    </div>
  );
}
