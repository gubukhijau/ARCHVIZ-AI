/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ARCHVIZ AI Mandatory Login Gate
 * Protects application access until user authenticates via ChatGPT OAuth2 or Email.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Lock,
  Mail,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Layers,
  SunMedium,
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '../lib/supabase.js';

interface AuthGateProps {
  onAuthenticated: (user: { email?: string; id?: string }, token?: string | null) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [tab, setTab] = useState<'oauth' | 'email'>('oauth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Listen for OAuth2 popup success message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost') &&
        !origin.includes('127.0.0.1')
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'openai') {
        const emailFromOAuth = event.data.email || 'chatgpt_user@openai.com';
        const oauthUser = {
          id: 'openai_' + Math.random().toString(36).substring(2, 9),
          email: emailFromOAuth,
        };
        localStorage.setItem('archviz_user', JSON.stringify(oauthUser));
        localStorage.setItem('openai_oauth_connected', 'true');
        setSuccessMsg(`Berhasil terhubung dengan Akun ChatGPT (${emailFromOAuth})`);
        setTimeout(() => {
          onAuthenticated(oauthUser, event.data.token);
        }, 800);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setErrorMsg('Otorisasi ChatGPT dibatalkan atau terjadi kesalahan.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAuthenticated]);

  // Start Popup OAuth2
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
      const popup = window.open(
        url,
        'chatgpt_oauth',
        'width=540,height=680,menubar=no,toolbar=no,status=no'
      );

      if (!popup) {
        setErrorMsg('Browser Anda memblokir popup. Izinkan popup untuk login dengan akun ChatGPT.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memulai otorisasi OAuth2.');
    } finally {
      setOauthLoading(false);
    }
  };

  // Email / Password Form Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
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
      // Local session mode
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const demoUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          email,
        };
        localStorage.setItem('archviz_user', JSON.stringify(demoUser));
        setSuccessMsg(`Selamat datang, ${email}!`);
        setTimeout(() => {
          onAuthenticated(demoUser, 'demo_token');
        }, 600);
      }, 500);
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          const authObj = { email: data.user.email || email, id: data.user.id };
          localStorage.setItem('archviz_user', JSON.stringify(authObj));
          setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke studio...');
          setTimeout(() => {
            onAuthenticated(authObj, data.session?.access_token || null);
          }, 800);
        } else {
          setSuccessMsg('Verifikasi email Anda untuk melanjutkan pendaftaran.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const authObj = { email: data.user.email || email, id: data.user.id };
          localStorage.setItem('archviz_user', JSON.stringify(authObj));
          setSuccessMsg('Berhasil masuk. Mengalihkan ke studio...');
          setTimeout(() => {
            onAuthenticated(authObj, data.session?.access_token || null);
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal autentikasi email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-neutral-100">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl mb-1">
            <Building2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ARCHVIZ AI</h1>
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-mono">
            Architectural Photo Realism Studio
          </p>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto pt-1 leading-relaxed">
            Akses Terbatas: Silakan login terlebih dahulu untuk mengakses studio peningkatan fotorealisme arsitektur.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-5">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl text-xs font-medium border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setTab('oauth');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'oauth'
                  ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Login ChatGPT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('email');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'email'
                  ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email &amp; Sandi</span>
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CHATGPT OAUTH2 (PRIMARY) */}
          {tab === 'oauth' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5 text-left">
                <p className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Autentikasi Terintegrasi ChatGPT (OpenAI)</span>
                </p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Masuk langsung menggunakan akun ChatGPT Anda untuk mengotorisasi render gambar arsitektur melalui OpenAI Engine.
                </p>
              </div>

              <button
                type="button"
                disabled={oauthLoading}
                onClick={handleStartOAuth2}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Bot className="w-4 h-4" />
                <span>{oauthLoading ? 'Membuka Otorisasi...' : 'Masuk dengan Akun ChatGPT (OAuth2)'}</span>
              </button>

              <div className="pt-2 text-[11px] text-neutral-500 text-center flex items-center justify-center gap-4">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-neutral-400" /> Zero Redesign
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <SunMedium className="w-3 h-3 text-neutral-400" /> 4 Preset Waktu
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL & PASSWORD */}
          {tab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 p-0.5 bg-neutral-950 rounded-lg text-xs font-medium border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`py-1 rounded-md transition-all cursor-pointer ${
                    authMode === 'login' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`py-1 rounded-md transition-all cursor-pointer ${
                    authMode === 'register' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                  }`}
                >
                  Daftar
                </button>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-neutral-300">Alamat Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@arsitek.com"
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-neutral-300">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Memproses...</span>
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Masuk ke Studio</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Buat Akun Baru</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-neutral-600 text-center">
          ARCHVIZ AI &copy; 2026 · Dilindungi dengan Autentikasi Terenkripsi &amp; OpenAI API Engine
        </p>
      </div>
    </div>
  );
};
