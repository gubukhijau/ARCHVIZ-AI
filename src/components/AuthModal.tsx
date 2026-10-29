/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, Mail, User, LogIn, UserPlus, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '../lib/supabase.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email?: string; id?: string } | null;
  onUserChanged: (user: { email?: string; id?: string } | null, token?: string | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Demo / Local session mode when Supabase credentials are not connected
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const demoUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          email,
        };
        onUserChanged(demoUser, 'demo_session_token');
        setSuccessMsg(`Berhasil masuk sebagai ${email} (Sesi Lokal Aktif)`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }, 600);
      return;
    }

    setLoading(true);
    try {
      if (tab === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onUserChanged(data.user, data.session?.access_token || null);
          setSuccessMsg('Pendaftaran berhasil! Akun Anda telah siap.');
          setTimeout(() => onClose(), 1200);
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
          setTimeout(() => onClose(), 1000);
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
    onUserChanged(null, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-neutral-200 shadow-xl overflow-hidden p-6 space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {currentUser ? (
          /* User Profile & Logout */
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
                Semua render job dan riwayat foto arsitektur Anda diisolasi secara aman menggunakan Row Level Security.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
              >
                Keluar (Logout)
              </button>
            </div>
          </div>
        ) : (
          /* Login / Register Form */
          <>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-900">
                {tab === 'login' ? 'Masuk ke ARCHVIZ AI' : 'Buat Akun Studio'}
              </h3>
              <p className="text-xs text-neutral-500">
                Simpan riwayat render arsitektur dan sinkronisasikan hasil resolusi tinggi.
              </p>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 rounded-md transition-all ${
                  tab === 'login' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                }`}
              >
                Masuk (Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 rounded-md transition-all ${
                  tab === 'register' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                }`}
              >
                Daftar (Register)
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Menghubungkan...</span>
                ) : tab === 'login' ? (
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
      </div>
    </div>
  );
};
