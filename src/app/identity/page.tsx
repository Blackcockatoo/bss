'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useIdentityProfileStore,
  getEmailError,
  getUsernameError,
  getAvatarSizeError,
  getPreferredIdentity,
  MAX_AVATAR_BYTES,
  type IdentityProfile,
} from '@/lib/identity/profile';
import { useQRMessagingStore } from '@/lib/qr-messaging';

const emptyProfile: IdentityProfile = {
  email: '',
  username: '',
  avatarDataUrl: '',
  updatedAt: null,
};

export default function IdentityPage() {
  const { profile, saveProfile, refreshProfile } = useIdentityProfileStore();
  const setLocalIdentity = useQRMessagingStore(state => state.setLocalIdentity);
  const [form, setForm] = useState<IdentityProfile>(emptyProfile);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  useEffect(() => () => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
  }, []);

  const emailError = useMemo(() => getEmailError(form.email), [form.email]);
  const usernameError = useMemo(() => getUsernameError(form.username), [form.username]);
  const hasErrors = Boolean(emailError || usernameError || avatarError);

  const handleSave = () => {
    if (hasErrors) {
      setSaveNotice('Fix the highlighted fields before saving.');
      return;
    }
    const saved = saveProfile(form);
    setLocalIdentity(getPreferredIdentity(saved));
    setForm(saved);
    setSaveNotice('Profile saved successfully.');
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = setTimeout(() => {
      setSaveNotice(null);
    }, 2500);
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const sizeError = getAvatarSizeError(file.size);
    if (sizeError) {
      setAvatarError(sizeError);
      event.target.value = '';
      return;
    }

    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({
        ...prev,
        avatarDataUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setForm(prev => ({ ...prev, avatarDataUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/80">Identity Vault</p>
            <h1 className="text-3xl font-bold">Owner Identity</h1>
            <p className="text-sm text-slate-400 mt-2">
              Keep your contact details and avatar synced across QR messaging and pet profiles.
            </p>
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Quick Access</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-zinc-500">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
                placeholder="you@metapet.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-xs text-slate-500">Stored locally in this browser; not transmitted.</p>
              {emailError && <p className="text-xs text-rose-400">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-zinc-500">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={event => setForm(prev => ({ ...prev, username: event.target.value }))}
                placeholder="Starlight Ranger"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {usernameError && <p className="text-xs text-rose-400">{usernameError}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wide text-zinc-500">Avatar</label>
                <span className="text-xs text-slate-500">Max {Math.round(MAX_AVATAR_BYTES / 1024)} KB</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl border border-slate-700 bg-slate-950/60 overflow-hidden flex items-center justify-center">
                  {form.avatarDataUrl ? (
                    <img src={form.avatarDataUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-slate-950/60 text-slate-200"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Avatar
                  </Button>
                  {form.avatarDataUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-200"
                      onClick={handleRemoveAvatar}
                    >
                      Remove avatar
                    </Button>
                  )}
                </div>
              </div>
              {avatarError && <p className="text-xs text-rose-400">{avatarError}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Identity
              </Button>
              {saveNotice && (
                <p className={`text-xs ${hasErrors ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {saveNotice}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Profile Preview</h2>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border border-slate-700 bg-slate-950/60 overflow-hidden flex items-center justify-center">
                {form.avatarDataUrl ? (
                  <img src={form.avatarDataUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  {form.username.trim() || 'Unnamed Owner'}
                </p>
                <p className="text-sm text-slate-400">
                  {form.email.trim() || 'Add email to enable QR messaging identity'}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-400 space-y-2">
              <p>
                Your QR Messaging identity will default to your email address. If you leave the email blank,
                we will use your username instead.
              </p>
              <p>
                Last updated: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'Not saved yet'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
