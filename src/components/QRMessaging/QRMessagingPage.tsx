'use client';

import { useState } from 'react';
import { QrCode, Camera, MessageSquare, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRGenerator } from './QRGenerator';
import { QRScanner } from './QRScanner';
import { MessagingPanel } from './MessagingPanel';
import { useQRMessagingStore } from '@/lib/qr-messaging';

type TabId = 'generate' | 'scan' | 'messaging' | 'history';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'generate', label: 'Generate', icon: <QrCode className="w-4 h-4" /> },
  { id: 'scan', label: 'Scan', icon: <Camera className="w-4 h-4" /> },
  { id: 'messaging', label: 'Messaging', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
];

export function QRMessagingPage() {
  const [activeTab, setActiveTab] = useState<TabId>('generate');

  const {
    generatedQRs,
    scannedQRs,
    clearQRHistory,
    defaultFormat,
    defaultErrorCorrection,
    encryptionMode,
  } = useQRMessagingStore();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            MOSS60 QR Messaging
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Integrity-oriented QR encoding and encrypted messaging
          </p>
        </div>

        {/* Settings indicator */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Settings className="w-4 h-4" />
          <span>{defaultFormat.toUpperCase()}</span>
          <span>•</span>
          <span>EC: {defaultErrorCorrection}</span>
          <span>•</span>
          <span>{encryptionMode}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700 pb-3">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className={`gap-2 ${
              activeTab === tab.id
                ? 'bg-cyan-600 hover:bg-cyan-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'generate' && (
          <div className="max-w-2xl mx-auto">
            <QRGenerator />
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="max-w-2xl mx-auto">
            <QRScanner />
          </div>
        )}

        {activeTab === 'messaging' && (
          <div className="max-w-3xl mx-auto">
            <MessagingPanel />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Generated QRs */}
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  Generated QR Codes
                </h3>
                <span className="text-xs text-zinc-500">
                  {generatedQRs.length} items
                </span>
              </div>

              {generatedQRs.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No QR codes generated yet
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {generatedQRs.map((qr, index) => (
                    <div
                      key={`${qr.createdAt}-${index}`}
                      className="rounded-lg bg-slate-900/50 p-3 border border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-100 font-mono truncate">
                            {qr.data.length > 60
                              ? `${qr.data.substring(0, 60)}...`
                              : qr.data}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-cyan-400">
                              {qr.format.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-zinc-500">•</span>
                            <span className="text-[10px] text-zinc-500">
                              EC: {qr.errorCorrection}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                          {formatTime(qr.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scanned QRs */}
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-400" />
                  Scanned QR Codes
                </h3>
                <span className="text-xs text-zinc-500">
                  {scannedQRs.length} items
                </span>
              </div>

              {scannedQRs.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No QR codes scanned yet
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scannedQRs.map((result, index) => (
                    <div
                      key={`${result.timestamp}-${index}`}
                      className={`rounded-lg p-3 border ${
                        result.success
                          ? 'bg-green-500/5 border-green-500/30'
                          : 'bg-rose-500/5 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-100 font-mono truncate">
                            {result.decoded.length > 60
                              ? `${result.decoded.substring(0, 60)}...`
                              : result.decoded}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] ${
                                result.success ? 'text-green-400' : 'text-rose-400'
                              }`}
                            >
                              {result.success ? 'Success' : 'Failed'}
                            </span>
                            <span className="text-[10px] text-zinc-500">•</span>
                            <span className="text-[10px] text-purple-400">
                              {result.format.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                          {formatTime(result.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear History */}
            {(generatedQRs.length > 0 || scannedQRs.length > 0) && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={clearQRHistory}
                  className="gap-2 border-slate-700 text-zinc-400 hover:text-rose-400 hover:border-rose-500/50"
                >
                  <History className="w-4 h-4" />
                  Clear History
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
