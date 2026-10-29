/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Shield,
  Key,
  Bot,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '../lib/supabase.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email?: string; id?: string } | null;
  onUserChanged: (user: { email?: string; id?: string } | null, token?: string | null) => void;
  onOpenAiKeyUpdated?: (key: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onOpenAiKeyUpdated,
}) => {
  // Navigation tabs: 'chatgpt' | 'account'
  const [modalSection, setModalSection] = useState<'chatgpt' | 'account'>('chatgpt');
  const [authSubTab, setAuthSubTab] = useState<'login' | 'register'>('login');

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ChatGPT & Personal OpenAI Key
  const [personalKey, setPersonalKey] = useState('');
  const [copiedActionUrl, setCopiedActionUrl] = useState(false);
  const [keySavedFeedback, setKeySavedFeedback] = useState(false);
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [oauthEmail, setOauthEmail] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user_openai_key') || '';
    setPersonalKey(saved);

    const isConnected = localStorage.getItem('openai_oauth_connected') === 'true';
    setIsOAuthConnected(isConnected);

    // Check server session for OAuth user
    fetch('/api/auth/openai/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setIsOAuthConnected(true);
          setOauthEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Listen for OAuth2 popup success message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow AI Studio preview domains and localhost
      if (
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost') &&
        !origin.includes('127.0.0.1')
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'openai') {
        const emailFromOAuth = event.data.email || 'chatgpt_user@openai.com';
        setIsOAuthConnected(true);
        setOauthEmail(emailFromOAuth);
        localStorage.setItem('openai_oauth_connected', 'true');

        const oauthUser = {
          id: 'openai_' + Math.random().toString(36).substring(2, 9),
          email: emailFromOAuth,
        };
        onUserChanged(oauthUser, event.data.token);
        localStorage.setItem('archviz_user', JSON.stringify(oauthUser));

        setSuccessMsg(`Berhasil terhubung dengan Akun ChatGPT (${emailFromOAuth})`);
        setTimeout(() => onClose(), 1200);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setErrorMsg('Otorisasi ChatGPT dibatalkan atau terjadi kesalahan.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUserChanged, onClose]);

  if (!isOpen) return null;

  // Trigger Popup-based OAuth2 Flow directly to Authorization URL
  const handleStartOAuth2 = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setOauthLoading(true);

    try {
      const res = await fetch('/api/auth/openai/url');
      if (!res.ok) {
        throw new Error('Gagal mendapatkan URL otorisasi ChatGPT OAuth2.');
      }
      const { url } = await res.json();

      // Open OAuth authorization URL directly in popup
      const popup = window.open(
        url,
        'chatgpt_oauth',
        'width=540,height=680,menubar=no,toolbar=no,status=no'
      );

      if (!popup) {
        setErrorMsg('Browser Anda memblokir jendela popup. Izinkan popup untuk login dengan ChatGPT.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memulai otorisasi OAuth2.');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleDisconnectOAuth = async () => {
    try {
      await fetch('/api/auth/openai/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsOAuthConnected(false);
    setOauthEmail(null);
    localStorage.removeItem('openai_oauth_connected');
    setSuccessMsg('Koneksi OAuth2 ChatGPT diputuskan.');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleSavePersonalKey = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = personalKey.trim();
    if (clean) {
      localStorage.setItem('user_openai_key', clean);
      if (onOpenAiKeyUpdated) onOpenAiKeyUpdated(clean);
      setKeySavedFeedback(true);
      setTimeout(() => setKeySavedFeedback(false), 2500);
    } else {
      localStorage.removeItem('user_openai_key');
      if (onOpenAiKeyUpdated) onOpenAiKeyUpdated('');
      setKeySavedFeedback(true);
      setTimeout(() => setKeySavedFeedback(false), 2500);
    }
  };

  const handleCopyActionUrl = () => {
    const url = `${window.location.origin}/api/openapi.json`;
    navigator.clipboard.writeText(url);
    setCopiedActionUrl(true);
    setTimeout(() => setCopiedActionUrl(false), 2500);
  };

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Harap isi email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const demoUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          email,
        };
        onUserChanged(demoUser, 'demo_session_token');
        setSuccessMsg(`Berhasil masuk sebagai ${email}`);
        setTimeout(() => onClose(), 1000);
      }, 500);
      return;
    }

    setLoading(true);
    try {
      if (authSubTab === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onUserChanged(data.user, data.session?.access_token || null);
          setSuccessMsg('Pendaftaran berhasil! Akun Anda telah siap.');
          setTimeout(() => onClose(), 1000);
        } else {
          setSuccessMsg('Verifikasi email Anda untuk melanjutkan pendaftaran.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onUserChanged(data.user, data.session?.access_token || null);
          setSuccessMsg('Berhasil masuk.');
          setTimeout(() => onClose(), 800);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal melakukan autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    handleDisconnectOAuth();
    onUserChanged(null, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-neutral-200 shadow-xl overflow-hidden p-6 space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Tabs: ChatGPT OAuth2 vs Akun Studio */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setModalSection('chatgpt')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              modalSection === 'chatgpt'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-emerald-600" />
            <span>Login Akun ChatGPT (OAuth2)</span>
          </button>
          <button
            type="button"
            onClick={() => setModalSection('account')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              modalSection === 'account'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Akun Studio & Cloud</span>
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: INTEGRASI CHATGPT (OAUTH2 & BYOK) */}
        {modalSection === 'chatgpt' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <span>Login OAuth2 Akun ChatGPT (OpenAI)</span>
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Masuk langsung dengan akun ChatGPT Anda untuk mengintegrasikan identitas akun dan memanfaatkan kuota API rendering arsitektur secara mandiri.
              </p>
            </div>

            {/* OAUTH2 DIRECT LOGIN CARD */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>OAuth2 SSO ChatGPT (Rekomendasi)</span>
                  </p>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5">
                    Otorisasi satu klik melalui jendela popup resmi. Sesi OAuth2 terhubung otomatis ke aplikasi.
                  </p>
                </div>
              </div>

              {isOAuthConnected ? (
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-neutral-900">Terhubung ke ChatGPT</span>
                      <p className="text-[11px] text-neutral-500">{oauthEmail || 'Akun OpenAI Aktif'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectOAuth}
                    className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors cursor-pointer"
                  >
                    Putuskan
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={oauthLoading}
                  onClick={handleStartOAuth2}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 text-xs font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Bot className="w-4 h-4" />
                  <span>{oauthLoading ? 'Membuka Otorisasi...' : 'Masuk dengan Akun ChatGPT (OAuth2)'}</span>
                </button>
              )}
            </div>

            {/* METODE BYOK */}
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2.5">
              <p className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Alternatif: API Key Akun OpenAI Pribadi (BYOK)</span>
              </p>
              <form onSubmit={handleSavePersonalKey} className="space-y-2">
                <input
                  type="password"
                  value={personalKey}
                  onChange={(e) => setPersonalKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <div className="flex items-center justify-between text-[11px]">
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-500 hover:text-neutral-900 underline flex items-center gap-1"
                  >
                    <span>Dashboard API Keys</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-medium bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {keySavedFeedback ? 'Tersimpan!' : 'Simpan Kunci'}
                  </button>
                </div>
              </form>
            </div>

            {/* CUSTOM GPT ACTION SCHEMA */}
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Custom GPT Action di ChatGPT Plus</span>
                </p>
                <button
                  type="button"
                  onClick={handleCopyActionUrl}
                  className="flex items-center gap-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 px-2 py-0.5 rounded cursor-pointer"
                >
                  {copiedActionUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedActionUrl ? 'Tersalin' : 'Salin Action URL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Tempel URL action di <em>ChatGPT &gt; Explore GPTs &gt; Create &gt; Actions</em> untuk merender langsung di dalam obrolan ChatGPT Anda.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: AKUN STUDIO & SUPABASE */}
        {modalSection === 'account' && (
          <>
            {currentUser ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-neutral-100 text-neutral-800">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{currentUser.email}</p>
                    <p className="text-xs text-neutral-500">ID: {currentUser.id?.slice(0, 12)}...</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-neutral-800">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Autentikasi & RLS Aktif</span>
                  </div>
                  <p>
                    Semua riwayat render dan galeri gambar Anda diisolasi secara aman menggunakan Supabase Row Level Security.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Keluar (Logout)
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-neutral-900">
                    {authSubTab === 'login' ? 'Masuk ke ARCHVIZ AI' : 'Buat Akun Studio'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Sinkronisasikan riwayat render arsitektur dan simpan hasil resolusi tinggi.
                  </p>
                </div>

                {/* Quick OAuth Button inside Account Tab */}
                <button
                  type="button"
                  disabled={oauthLoading}
                  onClick={handleStartOAuth2}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Masuk Cepat dengan Akun ChatGPT</span>
                </button>

                <div className="flex items-center gap-2 my-2 text-[11px] text-neutral-400">
                  <div className="h-px bg-neutral-200 flex-1" />
                  <span>atau dengan Email</span>
                  <div className="h-px bg-neutral-200 flex-1" />
                </div>

                <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthSubTab('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-1.5 rounded-md transition-all cursor-pointer ${
                      authSubTab === 'login' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                    }`}
                  >
                    Masuk (Login)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthSubTab('register');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-1.5 rounded-md transition-all cursor-pointer ${
                      authSubTab === 'register' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                    }`}
                  >
                    Daftar (Register)
                  </button>
                </div>

                <form onSubmit={handleSubmitAuth} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@arsitek.com"
                        className="w-full pl-9 pr-3.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700">Kata Sandi</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-9 pr-3.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Menghubungkan...</span>
                    ) : authSubTab === 'login' ? (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Masuk ke Akun</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Buat Akun Baru</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 text-[11px] text-neutral-400 border-t border-neutral-100 flex items-center justify-between">
                  <span>Status Supabase Auth:</span>
                  <span className={isSupabaseConfigured ? 'text-emerald-600 font-medium' : 'text-neutral-500'}>
                    {isSupabaseConfigured ? 'Terkoneksi' : 'Mode Sesi Cepat'}
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
