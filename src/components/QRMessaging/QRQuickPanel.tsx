'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QrCode, Camera, MessageSquare, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRGenerator } from './QRGenerator';
import { QRScanner } from './QRScanner';
import { useQRMessagingStore } from '@/lib/qr-messaging';

interface QRQuickPanelProps {
  defaultExpanded?: boolean;
}

export function QRQuickPanel({ defaultExpanded = false }: QRQuickPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [mode, setMode] = useState<'generate' | 'scan'>('generate');

  const { conversations, generatedQRs, scannedQRs } = useQRMessagingStore();

  const activeConversations = Object.values(conversations).filter(
    c => c.handshakeState?.connected
  ).length;

  const totalMessages = Object.values(conversations).reduce(
    (sum, c) => sum + c.messages.length,
    0
  );

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        onKeyDown={e => e.key === 'Enter' && setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">QR Messaging</h2>
            <p className="text-xs text-zinc-400">
              MOSS60 encrypted communication
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-500">
            <span>{generatedQRs.length} generated</span>
            <span>•</span>
            <span>{scannedQRs.length} scanned</span>
            {activeConversations > 0 && (
              <>
                <span>•</span>
                <span className="text-green-400">
                  {activeConversations} active
                </span>
              </>
            )}
          </div>

          {expanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'generate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('generate')}
              className={`flex-1 gap-2 ${
                mode === 'generate' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-slate-700'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Generate
            </Button>
            <Button
              variant={mode === 'scan' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('scan')}
              className={`flex-1 gap-2 ${
                mode === 'scan' ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-700'
              }`}
            >
              <Camera className="w-4 h-4" />
              Scan
            </Button>
          </div>

          {/* Quick Tools */}
          <div className="bg-slate-950/50 rounded-xl p-4">
            {mode === 'generate' ? (
              <QRGenerator compact />
            ) : (
              <QRScanner compact />
            )}
          </div>

          {/* Recent Activity */}
          {totalMessages > 0 && (
            <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <MessageSquare className="w-4 h-4" />
                <span>{totalMessages} messages in {Object.keys(conversations).length} conversations</span>
              </div>
            </div>
          )}

          {/* Full Page Link */}
          <Link href="/qr-messaging" className="block">
            <Button
              variant="outline"
              className="w-full gap-2 border-slate-700 text-zinc-300 hover:text-white hover:border-cyan-500/50"
            >
              <MessageSquare className="w-4 h-4" />
              Open Full Messaging Panel
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
