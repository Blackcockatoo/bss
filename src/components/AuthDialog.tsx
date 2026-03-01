'use client';

import { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth/store';
import type { UserRole } from '@/lib/auth/types';
import { ENABLE_AUTH } from '@/lib/env/features';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [error, setError] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);

  if (!ENABLE_AUTH) {
    return null;
  }

  const submitLogin = async () => {
    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error ?? 'Login failed.');
      return;
    }
    setError(null);
    onOpenChange(false);
  };

  const submitRegister = async () => {
    const result = await register(email, password, displayName, role);
    if (!result.ok) {
      setError(result.error ?? 'Registration failed.');
      return;
    }
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800">
        <DialogHeader>
          <DialogTitle>Meta-Pet Account</DialogTitle>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="w-full bg-slate-900 border border-slate-800">
              <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
            </TabsList>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400">Email</label>
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-zinc-100" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-zinc-100" />
              </div>
            </div>

            <TabsContent value="register" className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400">Display name</label>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-zinc-100" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Role</label>
                <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-zinc-100">
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </TabsContent>

            {error && <p className="text-xs text-rose-300">{error}</p>}

            <TabsContent value="login">
              <Button onClick={submitLogin} className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">Login</Button>
            </TabsContent>
            <TabsContent value="register">
              <Button onClick={submitRegister} className="w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300">Create account</Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
