'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  getDeviceKey,
  getDeviceKeyDisplay,
  createUnlockKey,
  redeemUnlockKey,
  getCreatedUnlockKeys,
  getRedeemedUnlocks,
  createPairingKey,
  acceptPairingKey,
  cancelPairingKey,
  getActivePairingKeys,
  getPairedDevices,
  createExportKey,
  getExportKeys,
  setDefaultExportKey,
  deleteExportKey,
  exportRawKey,
  importExportKey,
  type DeviceKey,
  type UnlockKey,
  type PairingKey,
  type ExportKey,
  type UnlockTarget,
} from '@/lib/keys';
import {
  Key,
  Copy,
  Check,
  Gift,
  Link2,
  Lock,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Shield,
  Clock,
  Users,
  Star,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

type Tab = 'device' | 'unlock' | 'pairing' | 'export';

export function DigitalKeyPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('device');
  const [deviceKey, setDeviceKey] = useState<DeviceKey | null>(null);
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [unlockKeys, setUnlockKeys] = useState<UnlockKey[]>([]);
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);
  const [pairingKeys, setPairingKeys] = useState<PairingKey[]>([]);
  const [pairedDevices, setPairedDevices] = useState<PairingKey[]>([]);
  const [exportKeys, setExportKeys] = useState<ExportKey[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Unlock key creation state
  const [showCreateUnlock, setShowCreateUnlock] = useState(false);
  const [newUnlockType, setNewUnlockType] = useState<'cosmetic' | 'achievement'>('cosmetic');
  const [newUnlockId, setNewUnlockId] = useState('');
  const [newUnlockExpiry, setNewUnlockExpiry] = useState<'never' | '1h' | '24h' | '7d'>('never');
  const [newUnlockMaxUses, setNewUnlockMaxUses] = useState<'unlimited' | '1' | '5' | '10'>('unlimited');

  // Redeem unlock state
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);

  // Pairing state
  const [newPairingCode, setNewPairingCode] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState('');
  const [pairingCountdown, setPairingCountdown] = useState<number>(0);

  // Export key state
  const [showCreateExport, setShowCreateExport] = useState(false);
  const [newExportName, setNewExportName] = useState('');
  const [newExportSecret, setNewExportSecret] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [importKeyName, setImportKeyName] = useState('');
  const [importKeyHex, setImportKeyHex] = useState('');
  const [showImport, setShowImport] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const dk = await getDeviceKey();
      setDeviceKey(dk);
      setDisplayCode(getDeviceKeyDisplay());
      setUnlockKeys(getCreatedUnlockKeys());
      setRedeemedIds(getRedeemedUnlocks());
      setPairingKeys(getActivePairingKeys());
      setPairedDevices(getPairedDevices());
      setExportKeys(getExportKeys());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Countdown timer for pairing
  useEffect(() => {
    if (!newPairingCode || pairingCountdown <= 0) return;

    const timer = setInterval(() => {
      setPairingCountdown(prev => {
        if (prev <= 1) {
          setNewPairingCode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [newPairingCode, pairingCountdown]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleCreateUnlockKey = async () => {
    if (!newUnlockId.trim()) {
      setError('Please enter an unlock target ID');
      return;
    }

    try {
      const unlocks: UnlockTarget[] = [{ type: newUnlockType, id: newUnlockId.trim() }];
      const expiresIn = newUnlockExpiry === 'never' ? undefined :
        newUnlockExpiry === '1h' ? 3600000 :
        newUnlockExpiry === '24h' ? 86400000 :
        604800000;
      const maxUses = newUnlockMaxUses === 'unlimited' ? undefined :
        parseInt(newUnlockMaxUses);

      const result = await createUnlockKey({ unlocks, expiresIn, maxUses });
      setSuccess(`Unlock key created: ${result.displayCode}`);
      setShowCreateUnlock(false);
      setNewUnlockId('');
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create unlock key');
    }
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      setRedeemResult({ success: false, message: 'Please enter a code' });
      return;
    }

    const result = await redeemUnlockKey(redeemCode.trim());
    if (result.valid && result.key && result.key.type === 'unlock') {
      const targets = result.key.unlocks.map(u => `${u.type}: ${('id' in u ? u.id : 'petId' in u ? u.petId : 'stage' in u ? u.stage : 'unknown')}`).join(', ');
      setRedeemResult({ success: true, message: `Unlocked: ${targets}` });
      setRedeemCode('');
      void loadData();
    } else {
      setRedeemResult({ success: false, message: result.error ?? 'Invalid code' });
    }
  };

  const handleCreatePairingKey = async () => {
    try {
      const result = await createPairingKey();
      setNewPairingCode(result.displayCode ?? null);
      setPairingCountdown(300); // 5 minutes
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pairing key');
    }
  };

  const handleAcceptPairing = async () => {
    if (!pairCode.trim()) {
      setError('Please enter a pairing code');
      return;
    }

    const result = await acceptPairingKey(pairCode.trim());
    if (result.valid) {
      setSuccess('Successfully paired with device!');
      setPairCode('');
      void loadData();
    } else {
      setError(result.error ?? 'Failed to pair');
    }
  };

  const handleCancelPairing = (keyId: string) => {
    cancelPairingKey(keyId);
    setNewPairingCode(null);
    void loadData();
  };

  const handleCreateExportKey = async () => {
    if (!newExportName.trim()) {
      setError('Please enter a name for the export key');
      return;
    }

    try {
      const result = await createExportKey(newExportName.trim());
      setNewExportSecret(result.secret ?? null);
      setSuccess('Export key created - save the secret key!');
      setNewExportName('');
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create export key');
    }
  };

  const handleImportExportKey = async () => {
    if (!importKeyName.trim() || !importKeyHex.trim()) {
      setError('Please enter both name and key');
      return;
    }

    try {
      await importExportKey(importKeyName.trim(), importKeyHex.trim());
      setSuccess('Export key imported successfully');
      setImportKeyName('');
      setImportKeyHex('');
      setShowImport(false);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import key');
    }
  };

  const handleDeleteExportKey = (keyId: string) => {
    if (!confirm('Delete this export key? You will not be able to decrypt data encrypted with it.')) return;
    deleteExportKey(keyId);
    void loadData();
  };

  const handleSetDefaultExportKey = (keyId: string) => {
    setDefaultExportKey(keyId);
    void loadData();
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60);
    const seconds = ms % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'device', label: 'Device', icon: <Shield className="w-4 h-4" /> },
    { id: 'unlock', label: 'Unlock', icon: <Gift className="w-4 h-4" /> },
    { id: 'pairing', label: 'Pairing', icon: <Link2 className="w-4 h-4" /> },
    { id: 'export', label: 'Export', icon: <Lock className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Key className="w-5 h-5 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Digital Keys</h2>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:text-rose-100">×</button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto hover:text-emerald-100">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-slate-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-slate-700/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Device Key Tab */}
        {activeTab === 'device' && deviceKey && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-amber-200">Device Identity</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">Fingerprint</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-slate-950/50 rounded text-cyan-300 font-mono text-sm">
                      {displayCode}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => displayCode && copyToClipboard(displayCode, 'device')}
                      className="border-slate-700"
                    >
                      {copied === 'device' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Created:</span>
                    <span className="ml-2 text-zinc-300">{new Date(deviceKey.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Last Used:</span>
                    <span className="ml-2 text-zinc-300">{new Date(deviceKey.lastUsedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-500">
              Your device key is a unique cryptographic identity stored locally. It's used to sign your pet's crest and verify data integrity.
            </p>
          </div>
        )}

        {/* Unlock Keys Tab */}
        {activeTab === 'unlock' && (
          <div className="space-y-4">
            {/* Redeem Section */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-pink-400" />
                <span className="font-semibold text-pink-200">Redeem Code</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="flex-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded text-sm text-zinc-100 font-mono placeholder:text-zinc-600"
                />
                <Button onClick={handleRedeemCode} className="bg-pink-600 hover:bg-pink-700">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Redeem
                </Button>
              </div>

              {redeemResult && (
                <p className={`mt-2 text-sm ${redeemResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {redeemResult.message}
                </p>
              )}
            </div>

            {/* Create Unlock Key */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold text-cyan-200">Create Unlock Key</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCreateUnlock(!showCreateUnlock)}
                  className="text-zinc-400"
                >
                  {showCreateUnlock ? 'Cancel' : 'New Key'}
                </Button>
              </div>

              {showCreateUnlock && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500">Type</label>
                      <select
                        value={newUnlockType}
                        onChange={e => setNewUnlockType(e.target.value as 'cosmetic' | 'achievement')}
                        className="w-full mt-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded text-sm text-zinc-100"
                      >
                        <option value="cosmetic">Cosmetic</option>
                        <option value="achievement">Achievement</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Target ID</label>
                      <input
                        type="text"
                        value={newUnlockId}
                        onChange={e => setNewUnlockId(e.target.value)}
                        placeholder="golden-crown"
                        className="w-full mt-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded text-sm text-zinc-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500">Expires</label>
                      <select
                        value={newUnlockExpiry}
                        onChange={e => setNewUnlockExpiry(e.target.value as typeof newUnlockExpiry)}
                        className="w-full mt-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded text-sm text-zinc-100"
                      >
                        <option value="never">Never</option>
                        <option value="1h">1 Hour</option>
                        <option value="24h">24 Hours</option>
                        <option value="7d">7 Days</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Max Uses</label>
                      <select
                        value={newUnlockMaxUses}
                        onChange={e => setNewUnlockMaxUses(e.target.value as typeof newUnlockMaxUses)}
                        className="w-full mt-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded text-sm text-zinc-100"
                      >
                        <option value="unlimited">Unlimited</option>
                        <option value="1">1 Use</option>
                        <option value="5">5 Uses</option>
                        <option value="10">10 Uses</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleCreateUnlockKey} className="w-full bg-cyan-600 hover:bg-cyan-700">
                    Create Unlock Key
                  </Button>
                </div>
              )}
            </div>

            {/* Created Keys List */}
            {unlockKeys.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-400">Your Created Keys</h4>
                {unlockKeys.map(key => (
                  <div key={key.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-sm">
                    <div className="flex items-center justify-between">
                      <code className="text-cyan-300 font-mono">{key.code}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(key.code, key.id)}
                      >
                        {copied === key.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                      <span>Uses: {key.usedCount}/{key.maxUses ?? '∞'}</span>
                      {key.expiresAt && (
                        <span className={Date.now() > key.expiresAt ? 'text-rose-400' : ''}>
                          {Date.now() > key.expiresAt ? 'Expired' : `Expires: ${new Date(key.expiresAt).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Redeemed Info */}
            {redeemedIds.length > 0 && (
              <p className="text-xs text-zinc-500">
                You have redeemed {redeemedIds.length} unlock code{redeemedIds.length !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
        )}

        {/* Pairing Keys Tab */}
        {activeTab === 'pairing' && (
          <div className="space-y-4">
            {/* Create Pairing Code */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-blue-200">Share Your Device</span>
              </div>

              {newPairingCode ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <code className="text-3xl font-bold text-cyan-300 tracking-wider">{newPairingCode}</code>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                    <Clock className="w-4 h-4" />
                    <span>Expires in {formatTime(pairingCountdown)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => copyToClipboard(newPairingCode, 'pairing-code')}
                    >
                      {copied === 'pairing-code' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      className="text-rose-400 border-rose-500/50"
                      onClick={() => {
                        const activeKey = pairingKeys.find(k => k.code === newPairingCode.replace('-', ''));
                        if (activeKey) handleCancelPairing(activeKey.id);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleCreatePairingKey} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Pairing Code
                </Button>
              )}
            </div>

            {/* Accept Pairing */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-purple-200">Pair with Another Device</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={pairCode}
                  onChange={e => setPairCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="flex-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded text-sm text-zinc-100 font-mono placeholder:text-zinc-600"
                />
                <Button onClick={handleAcceptPairing} className="bg-purple-600 hover:bg-purple-700">
                  Pair
                </Button>
              </div>
            </div>

            {/* Paired Devices */}
            {pairedDevices.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Paired Devices ({pairedDevices.length})
                </h4>
                {pairedDevices.map(device => (
                  <div key={device.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Device {device.pairedWith?.slice(0, 8)}</span>
                      <span className="text-xs text-zinc-500">
                        Paired {new Date(device.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export Keys Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            {/* Create Export Key */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold text-emerald-200">Export Encryption Keys</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowImport(!showImport)}
                    className="text-zinc-400"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCreateExport(!showCreateExport)}
                    className="text-zinc-400"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New
                  </Button>
                </div>
              </div>

              {/* Import Form */}
              {showImport && (
                <div className="space-y-3 mb-4 p-3 rounded bg-slate-900/50">
                  <div>
                    <label className="text-xs text-zinc-500">Key Name</label>
                    <input
                      type="text"
                      value={importKeyName}
                      onChange={e => setImportKeyName(e.target.value)}
                      placeholder="My Backup Key"
                      className="w-full mt-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded text-sm text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Key (64 hex characters)</label>
                    <input
                      type="text"
                      value={importKeyHex}
                      onChange={e => setImportKeyHex(e.target.value)}
                      placeholder="a1b2c3d4..."
                      className="w-full mt-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded text-sm text-zinc-100 font-mono"
                    />
                  </div>
                  <Button onClick={handleImportExportKey} className="w-full">Import Key</Button>
                </div>
              )}

              {/* Create Form */}
              {showCreateExport && (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-zinc-500">Key Name</label>
                    <input
                      type="text"
                      value={newExportName}
                      onChange={e => setNewExportName(e.target.value)}
                      placeholder="My Backup Key"
                      className="w-full mt-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded text-sm text-zinc-100"
                    />
                  </div>
                  <Button onClick={handleCreateExportKey} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Generate Export Key
                  </Button>
                </div>
              )}

              {/* New Key Secret Display */}
              {newExportSecret && (
                <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <p className="text-sm text-amber-200 font-semibold">Save this key! It won't be shown again.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 bg-slate-950/50 rounded text-xs text-cyan-300 font-mono break-all">
                      {newExportSecret}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(newExportSecret, 'new-secret')}
                    >
                      {copied === 'new-secret' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setNewExportSecret(null)} className="w-full">
                    I've Saved It
                  </Button>
                </div>
              )}
            </div>

            {/* Export Keys List */}
            {exportKeys.length > 0 ? (
              <div className="space-y-2">
                {exportKeys.map(key => {
                  const rawKey = exportRawKey(key.id);
                  const showSecret = showSecrets[key.id];

                  return (
                    <div key={key.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {key.isDefault && <Star className="w-4 h-4 text-amber-400" />}
                          <span className="font-medium text-zinc-200">{key.name}</span>
                        </div>
                        <div className="flex gap-1">
                          {!key.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSetDefaultExportKey(key.id)}
                              title="Set as default"
                            >
                              <Star className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowSecrets(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                          >
                            {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-400"
                            onClick={() => handleDeleteExportKey(key.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-zinc-500 space-y-1">
                        <div>Fingerprint: <code className="text-cyan-400">{key.fingerprint.toUpperCase()}</code></div>
                        <div>Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                      </div>

                      {showSecret && rawKey && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-slate-950/50 rounded text-xs text-amber-300 font-mono break-all">
                            {rawKey}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(rawKey, `secret-${key.id}`)}
                          >
                            {copied === `secret-${key.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-4">
                No export keys yet. Create one to encrypt your pet backups.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
