'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import {
  useQRMessagingStore,
  serializeProtocolEnvelope,
  hashData,
  type EncodingFormat,
  type ErrorCorrectionLevel,
} from '@/lib/qr-messaging';

interface QRGeneratorProps {
  compact?: boolean;
  onGenerate?: (data: string) => void;
}

export function QRGenerator({ compact = false, onGenerate }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputData, setInputData] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    defaultFormat,
    defaultErrorCorrection,
    setDefaultFormat,
    setDefaultErrorCorrection,
    addGeneratedQR,
  } = useQRMessagingStore();

  const [format, setFormat] = useState<EncodingFormat>(defaultFormat);
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>(defaultErrorCorrection);

  // Sync with store defaults
  useEffect(() => {
    setFormat(defaultFormat);
  }, [defaultFormat]);

  useEffect(() => {
    setErrorCorrection(defaultErrorCorrection);
  }, [defaultErrorCorrection]);

  const generateQR = useCallback(async () => {
    if (!inputData.trim()) {
      setError('Enter data to encode');
      return;
    }

    setError(null);

    try {
      const encodedData = serializeProtocolEnvelope(inputData, format);
      const canvas = canvasRef.current;

      if (!canvas) return;

      await QRCode.toCanvas(canvas, encodedData, {
        errorCorrectionLevel: errorCorrection,
        width: compact ? 200 : 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      setQrGenerated(true);

      // Store in history
      addGeneratedQR({
        data: encodedData,
        format,
        errorCorrection,
        createdAt: Date.now(),
        hash: hashData(inputData),
      });

      // Update store defaults
      setDefaultFormat(format);
      setDefaultErrorCorrection(errorCorrection);

      onGenerate?.(encodedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'QR generation failed';
      setError(message);
      setQrGenerated(false);
    }
  }, [
    inputData,
    format,
    errorCorrection,
    compact,
    addGeneratedQR,
    setDefaultFormat,
    setDefaultErrorCorrection,
    onGenerate,
  ]);

  const downloadQR = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `moss60-qr-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const copyToClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy data URL
      try {
        await navigator.clipboard.writeText(canvas.toDataURL('image/png'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setError('Failed to copy to clipboard');
      }
    }
  }, []);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputData}
            onChange={e => setInputData(e.target.value)}
            placeholder="Enter data..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Button onClick={generateQR} size="sm" className="gap-1">
            <QrCode className="w-4 h-4" />
            Generate
          </Button>
        </div>

        {qrGenerated && (
          <div className="flex flex-col items-center gap-2">
            <canvas
              ref={canvasRef}
              className="rounded-lg border border-slate-700 bg-white"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadQR}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {!qrGenerated && (
          <canvas ref={canvasRef} className="hidden" />
        )}

        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Data to Encode
          </label>
          <textarea
            value={inputData}
            onChange={e => setInputData(e.target.value)}
            placeholder="Enter text, JSON, or any data to encode..."
            className="w-full min-h-[100px] rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
          />
        </div>

        {/* Format Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Encoding Format
            </label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value as EncodingFormat)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="base60">Base-60 (MOSS60)</option>
              <option value="hex">Hexadecimal</option>
              <option value="text">Plain Text</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Error Correction
            </label>
            <select
              value={errorCorrection}
              onChange={e => setErrorCorrection(e.target.value as ErrorCorrectionLevel)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </div>
        </div>

        <Button onClick={generateQR} className="w-full gap-2">
          <QrCode className="w-5 h-5" />
          Generate QR Code
        </Button>
      </div>

      {/* QR Display */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={`rounded-xl border-2 p-4 transition-all ${
            qrGenerated
              ? 'border-cyan-500/50 bg-white'
              : 'border-slate-700 border-dashed bg-slate-950/40'
          }`}
        >
          <canvas
            ref={canvasRef}
            className={qrGenerated ? '' : 'opacity-0'}
            width={300}
            height={300}
          />
          {!qrGenerated && (
            <div className="w-[300px] h-[300px] flex items-center justify-center text-zinc-500 text-sm">
              QR code will appear here
            </div>
          )}
        </div>

        {qrGenerated && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={downloadQR} className="gap-2">
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
            <Button variant="outline" onClick={copyToClipboard} className="gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
        <p className="text-xs text-zinc-500">
          <strong className="text-cyan-400">Base-60 QR Codes</strong> use MOSS60
          encoding for compact, tamper-evident payload formatting. Helpful for
          key exchange and integrity-oriented data transfer.
          <a
            href="/docs/security-notes/qr-messaging-threat-model.md"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-cyan-300 underline decoration-dotted underline-offset-2 hover:text-cyan-200"
            title="Read what MOSS60 QR encoding guarantees (and what it does not)."
          >
            Security notes
          </a>
        </p>
      </div>
    </div>
  );
}
