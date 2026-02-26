'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  ArrowLeft,
  BookOpen,
  Dna,
  FlaskConical,
  Home,
  PawPrint,
  QrCode,
  UserCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/haptics';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/pet', label: 'Pet', icon: PawPrint },
  { href: '/school-game', label: 'School', icon: BookOpen },
  { href: '/identity', label: 'Identity', icon: UserCircle },
  { href: '/genome-explorer', label: 'Genome', icon: Dna },
];

const LAB_ITEMS = [
  { href: '/qr-messaging', label: 'QR (Experimental)', icon: QrCode },
];

export function QuickNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isLabsOpen, setIsLabsOpen] = useState(false);

  const handleBack = useCallback(() => {
    triggerHaptic('light');
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  }, [router]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showInstall = useMemo(() => installPrompt !== null, [installPrompt]);

  useEffect(() => {
    setIsLabsOpen(false);
  }, [pathname]);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) {
      return;
    }
    triggerHaptic('success');
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const handleNavClick = useCallback(() => {
    triggerHaptic('selection');
  }, []);

  const handleLabsToggle = useCallback(() => {
    triggerHaptic('selection');
    setIsLabsOpen(open => !open);
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-4 pointer-events-none">
      <div className="max-w-lg mx-auto">
        <div className="pointer-events-auto flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/90 px-2 py-2 shadow-lg shadow-slate-950/60 backdrop-blur-lg">
          {/* Back button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-12 w-12 rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-white touch-manipulation"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-700/50" />

          {/* Nav Items */}
          <div className="flex-1 flex items-center justify-around">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className="flex"
                >
                  <div
                    className={`
                      flex flex-col items-center justify-center gap-0.5
                      min-w-[52px] h-12 px-2 rounded-xl
                      transition-all duration-200
                      touch-manipulation
                      ${isActive
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white active:scale-95'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span className={`text-[9px] font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleLabsToggle}
                className={`h-12 w-12 rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-white touch-manipulation ${
                  isLabsOpen ? 'bg-slate-800/70 text-white' : ''
                }`}
                aria-label="Toggle labs navigation"
              >
                <FlaskConical className="h-5 w-5" />
              </Button>
              {isLabsOpen && (
                <div className="absolute bottom-14 right-0 w-44 rounded-xl border border-slate-700/70 bg-slate-950/95 p-2 shadow-lg shadow-slate-950/60 backdrop-blur-lg">
                  <div className="px-2 pb-1 text-[10px] uppercase tracking-wide text-slate-500">
                    Labs
                  </div>
                  <div className="space-y-1">
                    {LAB_ITEMS.map(item => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleNavClick}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800/70 hover:text-white"
                        >
                          <Icon className="h-4 w-4" />
                          <span className={isActive ? 'text-cyan-300' : undefined}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Install button */}
          {showInstall && (
            <>
              <div className="h-8 w-px bg-slate-700/50" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleInstall}
                className="h-12 w-12 rounded-xl text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 touch-manipulation"
                aria-label="Install app"
              >
                <ArrowDownToLine className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
