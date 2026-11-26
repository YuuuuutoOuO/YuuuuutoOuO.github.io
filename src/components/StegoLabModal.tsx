import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Download,
  Eye,
  EyeOff,
  Grid2x2,
  Image as ImageIcon,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Unlock,
  Upload,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  buildBitPlaneImageData,
  buildDiffImageData,
  createSampleCoverImageData,
  embedLsb,
  extractLsb,
  getCapacityBytes,
  imageDataToDataUrl,
  loadFileToImageData,
  type EmbedResult,
  type ExtractResult,
  type LsbBits,
} from '../utils/stego';
import {
  aesCtrTransformImage,
  compressAmbtc,
  computeCompactHistogram,
  computeEntropy,
  type AesImageResult,
  type AmbtcBlockSize,
  type AmbtcColorMode,
  type AmbtcResult,
} from '../utils/imageLab';

export type LabModule = 'stego' | 'ambtc' | 'aes';

interface StegoLabModalProps {
  open: boolean;
  onClose: () => void;
  initialModule?: LabModule;
}

type StegoTab = 'embed' | 'extract';
type StegoViewMode = 'stego' | 'cover' | 'bitplane' | 'diff';
type AmbtcViewMode = 'reconstructed' | 'original' | 'bitmap' | 'error';
type AesViewMode = 'output' | 'input' | 'histogram';

function formatPsnr(psnr: number): string {
  if (!Number.isFinite(psnr) || psnr > 99.99) return '∞ dB';
  return `${psnr.toFixed(2)} dB`;
}

export const StegoLabModal: React.FC<StegoLabModalProps> = ({
  open,
  onClose,
  initialModule = 'stego',
}) => {
  const { lang } = useLanguage();
  const isZh = lang === 'zh';

  const [activeModule, setActiveModule] = useState<LabModule>(initialModule);

  // Sync active module when modal opens from a specific LabDock shortcut
  useEffect(() => {
    if (open) {
      setActiveModule(initialModule);
    }
  }, [open, initialModule]);

  // Shared / LSB Stego state
  const [tab, setTab] = useState<StegoTab>('embed');
  const [bits, setBits] = useState<LsbBits>(2);
  const [secretText, setSecretText] = useState<string>(
    'Hello from ChuOS! This message is hidden inside 2-bit LSB pixels.',
  );
  const [coverData, setCoverData] = useState<ImageData | null>(null);
  const [embedResult, setEmbedResult] = useState<EmbedResult | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<StegoViewMode>('stego');

  const [extractImageData, setExtractImageData] = useState<ImageData | null>(null);
  const [extractResult, setExtractResult] = useState<ExtractResult | null>(null);
  const [extractPreviewUrl, setExtractPreviewUrl] = useState<string | null>(null);

  // AMBTC Compression state
  const [ambtcSource, setAmbtcSource] = useState<ImageData | null>(null);
  const [ambtcBlockSize, setAmbtcBlockSize] = useState<AmbtcBlockSize>(4);
  const [ambtcColorMode, setAmbtcColorMode] = useState<AmbtcColorMode>('rgb');
  const [ambtcResult, setAmbtcResult] = useState<AmbtcResult | null>(null);
  const [ambtcView, setAmbtcView] = useState<AmbtcViewMode>('reconstructed');
  const [ambtcError, setAmbtcError] = useState<string | null>(null);

  // AES Image Encryption state
  const [aesSource, setAesSource] = useState<ImageData | null>(null);
  const [aesKey, setAesKey] = useState<string>('ChuOS-AES-2026');
  const [showAesKey, setShowAesKey] = useState<boolean>(true);
  const [aesResult, setAesResult] = useState<AesImageResult | null>(null);
  const [aesModeLabel, setAesModeLabel] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [aesView, setAesView] = useState<AesViewMode>('output');
  const [aesBusy, setAesBusy] = useState<boolean>(false);
  const [aesError, setAesError] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const extractInputRef = useRef<HTMLInputElement>(null);
  const ambtcInputRef = useRef<HTMLInputElement>(null);
  const aesInputRef = useRef<HTMLInputElement>(null);

  // Initialize built-in sample image on first open so visitors can try immediately
  useEffect(() => {
    if (!open) return;
    if (!coverData) {
      const sample = createSampleCoverImageData();
      setCoverData(sample);
      setAmbtcSource((prev) => prev ?? sample);
      setAesSource((prev) => prev ?? sample);
    }
  }, [open, coverData]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // --- LSB Derived values ---
  const capacityBytes = useMemo(() => {
    if (!coverData) return 0;
    return getCapacityBytes(coverData.width, coverData.height, bits);
  }, [coverData, bits]);

  const stegoEntropy = useMemo(() => {
    if (!embedResult) return null;
    return computeEntropy(embedResult.stegoImageData);
  }, [embedResult]);

  const previewUrl = useMemo(() => {
    if (!coverData) return null;
    if (!embedResult || viewMode === 'cover') {
      return imageDataToDataUrl(coverData);
    }
    if (viewMode === 'stego') {
      return imageDataToDataUrl(embedResult.stegoImageData);
    }
    if (viewMode === 'bitplane') {
      return imageDataToDataUrl(buildBitPlaneImageData(embedResult.stegoImageData, bits));
    }
    return imageDataToDataUrl(buildDiffImageData(coverData, embedResult.stegoImageData));
  }, [coverData, embedResult, viewMode, bits]);

  // --- AMBTC Derived values ---
  const ambtcPreviewUrl = useMemo(() => {
    if (!ambtcSource) return null;
    if (!ambtcResult) return imageDataToDataUrl(ambtcSource);
    if (ambtcView === 'original') return imageDataToDataUrl(ambtcResult.originalProcessed);
    if (ambtcView === 'bitmap') return imageDataToDataUrl(ambtcResult.bitmapImageData);
    if (ambtcView === 'error') return imageDataToDataUrl(ambtcResult.errorMapImageData);
    return imageDataToDataUrl(ambtcResult.reconstructed);
  }, [ambtcSource, ambtcResult, ambtcView]);

  // --- AES Derived values ---
  const aesPreviewUrl = useMemo(() => {
    if (!aesSource) return null;
    if (!aesResult || aesView === 'input') return imageDataToDataUrl(aesSource);
    return imageDataToDataUrl(aesResult.outputImageData);
  }, [aesSource, aesResult, aesView]);

  const aesHistograms = useMemo(() => {
    if (!aesSource || !aesResult || aesView !== 'histogram') return null;
    return {
      input: computeCompactHistogram(aesSource, 48),
      output: computeCompactHistogram(aesResult.outputImageData, 48),
    };
  }, [aesSource, aesResult, aesView]);

  // --- LSB Handlers ---
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await loadFileToImageData(file, 720);
      setCoverData(data);
      setEmbedResult(null);
      setEmbedError(null);
      setViewMode('cover');
    } catch (err) {
      setEmbedError(err instanceof Error ? err.message : 'Failed to load image.');
    }
    e.target.value = '';
  };

  const handleUseSampleCover = () => {
    setCoverData(createSampleCoverImageData());
    setEmbedResult(null);
    setEmbedError(null);
    setViewMode('cover');
  };

  const handleRunEmbed = () => {
    if (!coverData) return;
    if (!secretText.trim()) {
      setEmbedError(isZh ? '請先輸入欲隱藏的秘密訊息。' : 'Please enter a secret message first.');
      return;
    }
    try {
      const res = embedLsb(coverData, secretText, bits);
      setEmbedResult(res);
      setEmbedError(null);
      setViewMode('stego');
    } catch (err) {
      setEmbedError(err instanceof Error ? err.message : 'Embedding failed.');
    }
  };

  const handleDownloadImage = (imageData: ImageData, filename: string) => {
    const url = imageDataToDataUrl(imageData);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleSendToExtract = () => {
    if (!embedResult) return;
    const stego = embedResult.stegoImageData;
    setExtractImageData(stego);
    setExtractPreviewUrl(imageDataToDataUrl(stego));
    setExtractResult(extractLsb(stego, bits));
    setTab('extract');
  };

  const handleExtractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await loadFileToImageData(file, Number.POSITIVE_INFINITY);
      setExtractImageData(data);
      setExtractPreviewUrl(imageDataToDataUrl(data));
      setExtractResult(extractLsb(data));
    } catch (err) {
      setExtractResult({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to decode image.',
      });
    }
    e.target.value = '';
  };

  // --- AMBTC Handlers ---
  const handleAmbtcUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await loadFileToImageData(file, 720);
      setAmbtcSource(data);
      setAmbtcResult(null);
      setAmbtcError(null);
      setAmbtcView('original');
    } catch (err) {
      setAmbtcError(err instanceof Error ? err.message : 'Failed to load image.');
    }
    e.target.value = '';
  };

  const handleRunAmbtc = () => {
    if (!ambtcSource) return;
    try {
      const res = compressAmbtc(ambtcSource, ambtcBlockSize, ambtcColorMode);
      setAmbtcResult(res);
      setAmbtcError(null);
      setAmbtcView('reconstructed');
    } catch (err) {
      setAmbtcError(err instanceof Error ? err.message : 'AMBTC compression failed.');
    }
  };

  // --- AES Handlers ---
  const handleAesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Do not resize PNGs so previously encrypted PNGs can be decrypted losslessly!
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      const data = await loadFileToImageData(file, isPng ? Number.POSITIVE_INFINITY : 720);
      setAesSource(data);
      setAesResult(null);
      setAesError(null);
      setAesView('input');
    } catch (err) {
      setAesError(err instanceof Error ? err.message : 'Failed to load image.');
    }
    e.target.value = '';
  };

  const handleRunAes = async (mode: 'encrypt' | 'decrypt') => {
    if (!aesSource) return;
    if (!aesKey.trim()) {
      setAesError(isZh ? '請輸入 AES 金鑰。' : 'Please enter an AES key.');
      return;
    }
    setAesBusy(true);
    setAesError(null);
    try {
      const res = await aesCtrTransformImage(aesSource, aesKey);
      setAesResult(res);
      setAesModeLabel(mode);
      setAesView('output');
    } catch (err) {
      setAesError(err instanceof Error ? err.message : 'AES processing failed.');
    } finally {
      setAesBusy(false);
    }
  };

  const handleUseOutputAsAesInput = () => {
    if (!aesResult) return;
    setAesSource(aesResult.outputImageData);
    setAesResult(null);
    setAesView('input');
  };

  const handleGenerateRandomKey = () => {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    setAesKey(`AES-${hex.toUpperCase()}`);
    setAesResult(null);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Security & Compression Interactive Lab"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-paper border border-stone-200 dark:border-slate-700 shadow-2xl text-ink"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-paper/95 backdrop-blur-md border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-academic-900 dark:bg-sky-500/20 text-white dark:text-sky-300 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif font-semibold text-base sm:text-lg leading-tight">
                {isZh ? '影像安全與壓縮互動實驗室' : 'Image Security & Compression Lab'}
              </h3>
              <p className="text-[11px] font-mono text-slate-500">
                LSB Steganography · AMBTC Compression · AES-256-CTR Encryption
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close Lab"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ISO/IEC 27701 Privacy-by-Design Notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-800">
                {isZh
                  ? 'ISO/IEC 27701 隱私資訊管理（PIMS）本地端運算聲明'
                  : 'ISO/IEC 27701 (PIMS) Privacy-by-Design — 100% Local Execution'}
              </p>
              <p className="text-slate-700">
                {isZh
                  ? '本實驗室所有影像隱寫、AMBTC 壓縮、AES 加解密與量化指標分析皆 100% 於您的瀏覽器本地記憶體執行，不會上傳任何圖片、金鑰或訊息至伺服器。'
                  : 'All steganography, AMBTC compression, AES encryption/decryption, and metric calculations run 100% locally in browser memory. Zero images, keys, or messages are ever uploaded.'}
              </p>
            </div>
          </div>

          {/* Top-Level Module Switcher */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-stone-100 border border-stone-200/80">
            {(
              [
                {
                  id: 'stego' as LabModule,
                  icon: ImageIcon,
                  zh: 'LSB 影像隱寫',
                  en: 'LSB Stego',
                  sub: '1/2-bit · Bit-Plane',
                },
                {
                  id: 'ambtc' as LabModule,
                  icon: Grid2x2,
                  zh: 'AMBTC 影像壓縮',
                  en: 'AMBTC Codec',
                  sub: '4×4 / 8×8 · bpp',
                },
                {
                  id: 'aes' as LabModule,
                  icon: KeyRound,
                  zh: 'AES 影像加密',
                  en: 'AES Encryption',
                  sub: 'AES-256-CTR · Entropy',
                },
              ] as const
            ).map((mod) => {
              const Icon = mod.icon;
              const active = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                    active
                      ? 'bg-academic-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {isZh ? mod.zh : mod.en}
                    </div>
                    <div
                      className={`text-[10px] font-mono truncate hidden sm:block ${
                        active ? 'text-white/75' : 'text-slate-500'
                      }`}
                    >
                      {mod.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* =========================================================
              MODULE 1: LSB STEGANOGRAPHY
             ========================================================= */}
          {activeModule === 'stego' && (
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setTab('embed')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tab === 'embed'
                      ? 'bg-academic-900 text-white'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200/70'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isZh ? '嵌入訊息 (Embed)' : 'Embed Payload'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('extract')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tab === 'extract'
                      ? 'bg-academic-900 text-white'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200/70'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isZh ? '提取訊息 (Extract)' : 'Extract Payload'}</span>
                </button>
              </div>

              {tab === 'embed' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          {isZh ? '1. 選擇載體圖片 (Cover Image)' : '1. Select Cover Image'}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleUseSampleCover}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-[11px] font-medium text-slate-700 hover:bg-stone-200/70 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{isZh ? '內建範例圖' : 'Sample'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-300 bg-white text-[11px] font-medium text-slate-700 hover:border-academic-600 transition-colors"
                          >
                            <Upload className="w-3 h-3" />
                            <span>{isZh ? '上傳圖片' : 'Upload'}</span>
                          </button>
                          <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                      {coverData && (
                        <p className="text-[11px] font-mono text-slate-500">
                          {coverData.width} × {coverData.height} px ·{' '}
                          {isZh ? '最大容量' : 'Max Capacity'}: {capacityBytes.toLocaleString()} bytes
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        {isZh ? '2. 嵌入位元深度 (LSB Bit-Depth)' : '2. LSB Bit-Depth'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {([1, 2] as LsbBits[]).map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setBits(b);
                              setEmbedResult(null);
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-colors ${
                              bits === b
                                ? 'border-academic-600 bg-academic-50 text-academic-900'
                                : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300'
                            }`}
                          >
                            <div className="font-mono text-xs font-semibold">{b}-bit LSB</div>
                            <div className="text-[11px] opacity-80">
                              {b === 1
                                ? isZh
                                  ? '最高畫質 (PSNR > 51 dB)'
                                  : 'Highest fidelity (PSNR > 51 dB)'
                                : isZh
                                  ? '雙倍容量 (DLC-Stego 模式)'
                                  : '2× capacity (DLC-Stego mode)'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        {isZh ? '3. 輸入欲隱藏的秘密訊息（支援中文 UTF-8）' : '3. Secret Message (UTF-8 supported)'}
                      </label>
                      <textarea
                        rows={3}
                        value={secretText}
                        onChange={(e) => setSecretText(e.target.value)}
                        placeholder={isZh ? '輸入想藏進像素裡的文字...' : 'Enter text to hide inside pixels...'}
                        className="w-full rounded-lg border border-stone-300 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-ink focus:outline-none focus:border-academic-600"
                      />
                    </div>

                    {embedError && (
                      <p className="text-xs text-rose-500 font-medium">{embedError}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRunEmbed}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-academic-900 hover:bg-academic-700 text-white text-xs font-medium transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isZh ? '執行 LSB 嵌入' : 'Embed into Pixels'}</span>
                      </button>

                      {embedResult && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadImage(
                                embedResult.stegoImageData,
                                `stego-${bits}bit-lsb.png`,
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-medium text-slate-700 hover:border-academic-600 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isZh ? '下載無損 PNG' : 'Download PNG'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSendToExtract}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium hover:opacity-90 transition-opacity"
                          >
                            <span>{isZh ? '送去提取驗證' : 'Test Extract'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {embedResult && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                          <div className="text-[10px] font-mono text-slate-500">PSNR</div>
                          <div className="font-mono text-sm font-semibold text-academic-900">
                            {formatPsnr(embedResult.psnr)}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                          <div className="text-[10px] font-mono text-slate-500">MSE</div>
                          <div className="font-mono text-sm font-semibold text-academic-900">
                            {embedResult.mse.toFixed(4)}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                          <div className="text-[10px] font-mono text-slate-500">Entropy</div>
                          <div className="font-mono text-sm font-semibold text-academic-900">
                            {stegoEntropy !== null ? `${stegoEntropy.toFixed(4)}` : '-'}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                          <div className="text-[10px] font-mono text-slate-500">
                            {isZh ? '修改像素' : 'Mod. Pixels'}
                          </div>
                          <div className="font-mono text-sm font-semibold text-academic-900">
                            {embedResult.modifiedPixels.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Forensic Preview */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isZh ? '鑑識視覺檢視' : 'Forensic Inspector'}</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {(
                          [
                            { id: 'stego', label: isZh ? '載密圖' : 'Stego' },
                            { id: 'cover', label: isZh ? '原圖' : 'Cover' },
                            { id: 'bitplane', label: isZh ? 'LSB 位元平面' : 'Bit-Plane' },
                            { id: 'diff', label: isZh ? '差異定位圖' : 'Diff Map' },
                          ] as { id: StegoViewMode; label: string }[]
                        ).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            disabled={!embedResult && m.id !== 'cover'}
                            onClick={() => setViewMode(m.id)}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-40 ${
                              viewMode === m.id
                                ? 'bg-academic-900 text-white'
                                : 'bg-stone-100 text-slate-700 hover:bg-stone-200/70'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-slate-950/90 p-3 flex items-center justify-center min-h-[240px]">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Steganography forensic preview"
                          className="max-h-64 w-auto rounded-lg object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No image loaded</span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {viewMode === 'bitplane'
                        ? isZh
                          ? '🔍 位元平面模式：將最低 1~2 bit 放大至全動態範圍。左上方雜訊帶即為嵌入之秘密位元流，這正是隱寫分析偵測異常的核心特徵。'
                          : '🔍 Bit-Plane View: Amplifies the lowest 1–2 bits to full dynamic range, exposing the embedded bitstream artifact.'
                        : viewMode === 'diff'
                          ? isZh
                            ? '🎯 差異定位圖：桃紅色像素代表因嵌入負載而被改動的像素位置（像素值變化量僅 ±1~3，肉眼無法察覺）。'
                            : '🎯 Diff Map: Rose-highlighted pixels indicate coordinates modified by ±1–3 intensity levels.'
                          : isZh
                            ? '💡 提示：執行嵌入後，可切換上方「LSB 位元平面」或「差異定位圖」檢視數位鑑識痕跡。'
                            : '💡 Tip: After embedding, switch to "Bit-Plane" or "Diff Map" above to inspect the forensic footprint.'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Extract Sub-tab */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-700">
                        {isZh ? '上傳載密 PNG 圖片（自動偵測 1-bit / 2-bit LSB）' : 'Upload Stego PNG (Auto-detects 1-bit / 2-bit LSB)'}
                      </p>
                      <button
                        type="button"
                        onClick={() => extractInputRef.current?.click()}
                        className="w-full py-8 px-4 rounded-xl border-2 border-dashed border-stone-300 dark:border-slate-700 hover:border-academic-600 transition-colors flex flex-col items-center justify-center gap-2 text-slate-600"
                      >
                        <Upload className="w-5 h-5 text-academic-700" />
                        <span className="text-xs font-medium">
                          {isZh ? '點擊選擇 PNG 圖片進行本地提取' : 'Click to select a lossless PNG image'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isZh ? '（JPEG 壓縮會破壞 LSB 位元，請使用無損 PNG）' : '(Use lossless PNG; JPEG compression destroys LSB bits)'}
                        </span>
                      </button>
                      <input
                        ref={extractInputRef}
                        type="file"
                        accept="image/png,image/*"
                        onChange={handleExtractUpload}
                        className="hidden"
                      />
                    </div>

                    {extractResult && (
                      <div
                        className={`p-4 rounded-xl border space-y-2 ${
                          extractResult.ok
                            ? 'bg-emerald-50 border-emerald-200/80'
                            : 'bg-amber-50 border-amber-200/80'
                        }`}
                      >
                        {extractResult.ok ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-emerald-800">
                                {isZh ? '✅ 成功提取隱藏訊息！' : '✅ Hidden Payload Extracted!'}
                              </span>
                              <span className="font-mono text-[11px] text-emerald-700">
                                {extractResult.bitsUsed}-bit LSB · {extractResult.byteLength} bytes
                              </span>
                            </div>
                            <pre className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 font-mono text-xs text-ink whitespace-pre-wrap break-words">
                              {extractResult.text}
                            </pre>
                          </>
                        ) : (
                          <p className="text-xs text-amber-800 font-medium">
                            ⚠️ {extractResult.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {isZh ? '待分析影像預覽' : 'Inspected Image Preview'}
                    </span>
                    <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-slate-950/90 p-3 flex items-center justify-center min-h-[220px]">
                      {extractPreviewUrl ? (
                        <img
                          src={extractPreviewUrl}
                          alt="Uploaded stego image"
                          className="max-h-60 w-auto rounded-lg object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">
                          {isZh ? '尚未載入待提取圖片' : 'No image loaded yet'}
                        </span>
                      )}
                    </div>
                    {extractImageData && (
                      <p className="text-[11px] font-mono text-slate-500">
                        {extractImageData.width} × {extractImageData.height} px · Client-side decoded
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              MODULE 2: AMBTC IMAGE COMPRESSION
             ========================================================= */}
          {activeModule === 'ambtc' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {isZh ? '1. 選擇原始影像 (Input Image)' : '1. Select Input Image'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAmbtcSource(createSampleCoverImageData());
                          setAmbtcResult(null);
                          setAmbtcError(null);
                          setAmbtcView('original');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-[11px] font-medium text-slate-700 hover:bg-stone-200/70 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isZh ? '內建範例圖' : 'Sample'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => ambtcInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-300 bg-white text-[11px] font-medium text-slate-700 hover:border-academic-600 transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{isZh ? '上傳圖片' : 'Upload'}</span>
                      </button>
                      <input
                        ref={ambtcInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAmbtcUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {ambtcSource && (
                    <p className="text-[11px] font-mono text-slate-500">
                      {ambtcSource.width} × {ambtcSource.height} px ·{' '}
                      {isZh ? '區塊總數' : 'Blocks'}:{' '}
                      {(
                        Math.ceil(ambtcSource.width / ambtcBlockSize) *
                        Math.ceil(ambtcSource.height / ambtcBlockSize)
                      ).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Block Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {isZh ? '2. 區塊大小 (Block Size)' : '2. Block Size'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([4, 8] as AmbtcBlockSize[]).map((bs) => (
                      <button
                        key={bs}
                        type="button"
                        onClick={() => {
                          setAmbtcBlockSize(bs);
                          setAmbtcResult(null);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          ambtcBlockSize === bs
                            ? 'border-academic-600 bg-academic-50 text-academic-900'
                            : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300'
                        }`}
                      >
                        <div className="font-mono text-xs font-semibold">
                          {bs} × {bs} px
                        </div>
                        <div className="text-[11px] opacity-80">
                          {bs === 4
                            ? isZh
                              ? '經典標準 (2.00 bpp/ch · 4× 壓縮)'
                              : 'Standard (2.00 bpp/ch · 4× CR)'
                            : isZh
                              ? '高壓縮比 (1.25 bpp/ch · 6.4× 壓縮)'
                              : 'High CR (1.25 bpp/ch · 6.4× CR)'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {isZh ? '3. 色彩通道模式 (Color Space)' : '3. Color Space'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'rgb', zh: 'RGB 彩色通道', en: 'RGB Color (3-ch)' },
                        { id: 'gray', zh: 'Grayscale 灰階 (論文常用)', en: 'Grayscale (1-ch)' },
                      ] as { id: AmbtcColorMode; zh: string; en: string }[]
                    ).map((cm) => (
                      <button
                        key={cm.id}
                        type="button"
                        onClick={() => {
                          setAmbtcColorMode(cm.id);
                          setAmbtcResult(null);
                        }}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors ${
                          ambtcColorMode === cm.id
                            ? 'border-academic-600 bg-academic-50 text-academic-900'
                            : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300'
                        }`}
                      >
                        {isZh ? cm.zh : cm.en}
                      </button>
                    ))}
                  </div>
                </div>

                {ambtcError && <p className="text-xs text-rose-500 font-medium">{ambtcError}</p>}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunAmbtc}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-academic-900 hover:bg-academic-700 text-white text-xs font-medium transition-colors"
                  >
                    <Grid2x2 className="w-3.5 h-3.5" />
                    <span>{isZh ? '執行 AMBTC 壓縮重建' : 'Run AMBTC Compression'}</span>
                  </button>

                  {ambtcResult && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadImage(
                          ambtcResult.reconstructed,
                          `ambtc-${ambtcBlockSize}x${ambtcBlockSize}-${ambtcColorMode}.png`,
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-medium text-slate-700 hover:border-academic-600 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isZh ? '下載重建圖 PNG' : 'Download PNG'}</span>
                    </button>
                  )}
                </div>

                {/* AMBTC Quantitative Metrics */}
                {ambtcResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">PSNR</div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {formatPsnr(ambtcResult.psnr)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">MSE</div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {ambtcResult.mse.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">
                        {isZh ? '壓縮比 (CR)' : 'Comp. Ratio'}
                      </div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {ambtcResult.compressionRatio.toFixed(2)}× ({ambtcResult.bpp.toFixed(2)} bpp)
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">
                        {isZh ? '原圖 Entropy' : 'Orig. Entropy'}
                      </div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {ambtcResult.originalEntropy.toFixed(4)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">
                        {isZh ? '重建 Entropy' : 'Rec. Entropy'}
                      </div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {ambtcResult.reconstructedEntropy.toFixed(4)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">
                        {isZh ? '編碼區塊數' : 'Total Blocks'}
                      </div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {ambtcResult.blockCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Preview */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isZh ? '壓縮結果檢視' : 'Compression Inspector'}</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        { id: 'reconstructed', label: isZh ? '重建圖' : 'Reconstructed' },
                        { id: 'original', label: isZh ? '原圖' : 'Original' },
                        { id: 'bitmap', label: isZh ? '位元圖' : 'Bitmap' },
                        { id: 'error', label: isZh ? '誤差熱圖' : 'Error Map' },
                      ] as { id: AmbtcViewMode; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={!ambtcResult && m.id !== 'original'}
                        onClick={() => setAmbtcView(m.id)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-40 ${
                          ambtcView === m.id
                            ? 'bg-academic-900 text-white'
                            : 'bg-stone-100 text-slate-700 hover:bg-stone-200/70'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-slate-950/90 p-3 flex items-center justify-center min-h-[240px]">
                  {ambtcPreviewUrl ? (
                    <img
                      src={ambtcPreviewUrl}
                      alt="AMBTC compression preview"
                      className="max-h-64 w-auto rounded-lg object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No image loaded</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {ambtcView === 'bitmap'
                    ? isZh
                      ? '⬛⬜ AMBTC 位元圖（Bitmap）：每個區塊依區塊平均值二值化為 0（低量化值 L）與 1（高量化值 H），每組區塊僅需儲存 (L, H, Bitmap)。'
                      : '⬛⬜ AMBTC Bitmap: Each block is binarized against its block mean into 0 (low level L) and 1 (high level H).'
                    : ambtcView === 'error'
                      ? isZh
                        ? '🔥 量化誤差熱圖（×6 放大）：亮區顯示區塊量化損失較明顯的高頻邊緣區域。'
                        : '🔥 Quantization Error Map (6× amplified): Brighter areas highlight edge quantization artifacts.'
                      : isZh
                        ? '💡 AMBTC（Absolute Moment Block Truncation Coding）以極低運算複雜度保留區塊一階絕對動差，常用於即時壓縮與壓縮域資料隱藏研究。'
                        : '💡 AMBTC preserves the first absolute moment per block with minimal complexity—widely used in real-time compression & compressed-domain data hiding.'}
                </p>
              </div>
            </div>
          )}

          {/* =========================================================
              MODULE 3: AES IMAGE ENCRYPTION
             ========================================================= */}
          {activeModule === 'aes' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {isZh ? '1. 選擇明文或密文影像 (Input Image)' : '1. Select Plain / Cipher Image'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAesSource(createSampleCoverImageData());
                          setAesResult(null);
                          setAesError(null);
                          setAesView('input');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-[11px] font-medium text-slate-700 hover:bg-stone-200/70 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isZh ? '內建範例圖' : 'Sample'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => aesInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-300 bg-white text-[11px] font-medium text-slate-700 hover:border-academic-600 transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{isZh ? '上傳圖片' : 'Upload'}</span>
                      </button>
                      <input
                        ref={aesInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAesUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {aesSource && (
                    <p className="text-[11px] font-mono text-slate-500">
                      {aesSource.width} × {aesSource.height} px ·{' '}
                      {isZh ? 'Web Crypto 原生 AES-256-CTR 像素串流加密' : 'Native Web Crypto AES-256-CTR'}
                    </p>
                  )}
                </div>

                {/* AES Key Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {isZh ? '2. 輸入 AES 金鑰（經 SHA-256 衍生為 256-bit 金鑰）' : '2. AES Key (SHA-256 → 256-bit key)'}
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomKey}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-academic-700 hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isZh ? '隨機金鑰' : 'Random'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showAesKey ? 'text' : 'password'}
                      value={aesKey}
                      onChange={(e) => setAesKey(e.target.value)}
                      placeholder={isZh ? '輸入任意 AES 密鑰字串...' : 'Enter AES passphrase...'}
                      className="w-full rounded-lg border border-stone-300 bg-white dark:bg-slate-900 pl-3 pr-9 py-2 text-xs font-mono text-ink focus:outline-none focus:border-academic-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAesKey((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label={showAesKey ? 'Hide key' : 'Show key'}
                    >
                      {showAesKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {aesResult && (
                    <p className="text-[10px] font-mono text-slate-500">
                      SHA-256 Key Fingerprint: {aesResult.keyFingerprint}
                    </p>
                  )}
                </div>

                {aesError && <p className="text-xs text-rose-500 font-medium">{aesError}</p>}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={aesBusy}
                    onClick={() => handleRunAes('encrypt')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-academic-900 hover:bg-academic-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isZh ? '執行 AES 加密' : 'Encrypt (AES)'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={aesBusy}
                    onClick={() => handleRunAes('decrypt')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-academic-600 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isZh ? '執行 AES 解密' : 'Decrypt (AES)'}</span>
                  </button>

                  {aesResult && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadImage(
                            aesResult.outputImageData,
                            `aes-ctr-${aesModeLabel}.png`,
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-medium text-slate-700 hover:border-academic-600 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isZh ? '下載無損 PNG' : 'Download PNG'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleUseOutputAsAesInput}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        <span>
                          {aesModeLabel === 'encrypt'
                            ? isZh
                              ? '送去解密驗證'
                              : 'Send to Decrypt'
                            : isZh
                              ? '設為輸入圖'
                              : 'Use as Input'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* AES Quantitative Security Metrics */}
                {aesResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">
                        {isZh ? '輸出 Entropy' : 'Out. Entropy'}
                      </div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {aesResult.outputEntropy.toFixed(4)} / 8
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">
                        {isZh ? '輸入 Entropy' : 'In. Entropy'}
                      </div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {aesResult.inputEntropy.toFixed(4)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">PSNR</div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {formatPsnr(aesResult.psnr)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">MSE</div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {aesResult.mse.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">NPCR</div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {aesResult.npcr.toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="text-[10px] font-mono text-slate-500">UACI</div>
                      <div className="font-mono text-sm font-semibold text-academic-900">
                        {aesResult.uaci.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Preview & Histogram */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                    {aesView === 'histogram' ? (
                      <BarChart3 className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{isZh ? '加密視覺與統計檢視' : 'Cipher & Stats Inspector'}</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        { id: 'output', label: isZh ? '輸出結果' : 'Output' },
                        { id: 'input', label: isZh ? '輸入圖' : 'Input' },
                        { id: 'histogram', label: isZh ? '直方圖分布' : 'Histogram' },
                      ] as { id: AesViewMode; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={!aesResult && m.id !== 'input'}
                        onClick={() => setAesView(m.id)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-40 ${
                          aesView === m.id
                            ? 'bg-academic-900 text-white'
                            : 'bg-stone-100 text-slate-700 hover:bg-stone-200/70'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-slate-950/90 p-3 flex items-center justify-center min-h-[240px]">
                  {aesView === 'histogram' && aesHistograms ? (
                    <div className="w-full space-y-3 px-2">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>{isZh ? '輸入影像亮度直方圖' : 'Input Intensity Histogram'}</span>
                          <span>H = {aesResult?.inputEntropy.toFixed(4)} bits</span>
                        </div>
                        <div className="h-20 flex items-end gap-[2px] bg-slate-900/90 rounded p-1.5 border border-slate-800">
                          {aesHistograms.input.map((v, idx) => (
                            <div
                              key={idx}
                              style={{ height: `${Math.max(4, v * 100)}%` }}
                              className="flex-1 bg-sky-400/80 rounded-t-[1px]"
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>{isZh ? '輸出影像亮度直方圖' : 'Output Intensity Histogram'}</span>
                          <span>H = {aesResult?.outputEntropy.toFixed(4)} bits</span>
                        </div>
                        <div className="h-20 flex items-end gap-[2px] bg-slate-900/90 rounded p-1.5 border border-slate-800">
                          {aesHistograms.output.map((v, idx) => (
                            <div
                              key={idx}
                              style={{ height: `${Math.max(4, v * 100)}%` }}
                              className="flex-1 bg-emerald-400/80 rounded-t-[1px]"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : aesPreviewUrl ? (
                    <img
                      src={aesPreviewUrl}
                      alt="AES encryption preview"
                      className="max-h-64 w-auto rounded-lg object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No image loaded</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {isZh
                    ? '🔐 理想影像加密後：資訊熵 (Entropy) 會趨近理論上限 8.0 bits、NPCR ≈ 99.61%、UACI ≈ 33.46%，且亮度直方圖呈均勻平坦分布。點選「送去解密驗證」並用相同金鑰即可無損還原（修改任一字元則無法還原）。'
                    : '🔐 Ideal cipher images approach Entropy ≈ 8.0 bits, NPCR ≈ 99.61%, UACI ≈ 33.46%, with a flat uniform histogram. Click "Send to Decrypt" with the same key for lossless recovery.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
