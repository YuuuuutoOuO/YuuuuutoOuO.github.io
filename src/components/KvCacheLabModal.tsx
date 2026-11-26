import React, { useEffect, useMemo, useState } from 'react';
import { Cpu, Layers, Play, RotateCcw, Sparkles, X, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface KvCacheLabModalProps {
  open: boolean;
  onClose: () => void;
}

type CacheStrategy = 'aligned' | 'unaligned';

export const KvCacheLabModal: React.FC<KvCacheLabModalProps> = ({ open, onClose }) => {
  const { lang } = useLanguage();
  const isZh = lang === 'zh';

  const [strategy, setStrategy] = useState<CacheStrategy>('aligned');
  const [zone1Tokens, setZone1Tokens] = useState<number>(5500);
  const [prefillSpeed, setPrefillSpeed] = useState<number>(2800); // tokens/sec (local vLLM RTX GPU)
  const [turn, setTurn] = useState<number>(2);
  const [userPrompt, setUserPrompt] = useState<string>(
    'Summarize today’s Nessus scan status and check GPU VRAM usage.',
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const dynamicTokens = useMemo(() => {
    const promptEst = Math.max(12, Math.round(userPrompt.trim().length / 2.8));
    const historyEst = Math.max(0, (turn - 1) * 95);
    const timestampTokens = 18;
    return timestampTokens + historyEst + promptEst;
  }, [userPrompt, turn]);

  const metrics = useMemo(() => {
    const totalTokens = zone1Tokens + dynamicTokens;
    // In aligned mode (Zone 1 static prefix + Zone 2 dynamic suffix), Turn >= 2 hits 100% of Zone 1.
    // In unaligned mode (timestamp injected at token 0), the very first token diverges -> 0% prefix cache hit!
    const cachedTokens = strategy === 'aligned' && turn >= 2 ? zone1Tokens : 0;
    const prefillTokens = totalTokens - cachedTokens;
    const hitRatio = totalTokens > 0 ? (cachedTokens / totalTokens) * 100 : 0;

    // Overhead ~35ms scheduling/network + prefill compute time
    const ttftMs = Math.round(35 + (prefillTokens / prefillSpeed) * 1000);
    const unalignedTtftMs = Math.round(35 + (totalTokens / prefillSpeed) * 1000);
    const savedMs = Math.max(0, unalignedTtftMs - ttftMs);

    return {
      totalTokens,
      cachedTokens,
      prefillTokens,
      hitRatio,
      ttftMs,
      unalignedTtftMs,
      savedMs,
    };
  }, [zone1Tokens, dynamicTokens, strategy, turn, prefillSpeed]);

  // Build 48 visual token blocks to illustrate prefix cache hit vs miss
  const tokenBlocks = useMemo(() => {
    const totalBlocks = 48;
    const zone1Blocks = Math.max(
      8,
      Math.min(totalBlocks - 6, Math.round((zone1Tokens / metrics.totalTokens) * totalBlocks)),
    );
    const dynamicBlocks = totalBlocks - zone1Blocks;

    if (strategy === 'aligned') {
      return [
        ...Array.from({ length: zone1Blocks }, (_, i) => ({
          id: `z1-${i}`,
          zone: 'zone1' as const,
          hit: turn >= 2,
        })),
        ...Array.from({ length: dynamicBlocks }, (_, i) => ({
          id: `z2-${i}`,
          zone: 'zone2' as const,
          hit: false,
        })),
      ];
    }

    // Unaligned: 2 dynamic timestamp blocks at the very front invalidate everything after them!
    return [
      { id: 'ts-0', zone: 'timestamp' as const, hit: false },
      { id: 'ts-1', zone: 'timestamp' as const, hit: false },
      ...Array.from({ length: totalBlocks - 2 }, (_, i) => ({
        id: `miss-${i}`,
        zone: i < zone1Blocks ? ('zone1' as const) : ('zone2' as const),
        hit: false,
      })),
    ];
  }, [zone1Tokens, metrics.totalTokens, strategy, turn]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="LLM KV Cache Prefix Alignment Lab"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-paper border border-stone-200 dark:border-slate-700 shadow-2xl text-ink"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-paper/95 backdrop-blur-md border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-academic-900 dark:bg-sky-500/20 text-white dark:text-sky-300 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif font-semibold text-base sm:text-lg leading-tight">
                {isZh ? 'LLM KV Cache 前綴對齊視覺化實驗室' : 'LLM KV Cache Prefix Alignment Lab'}
              </h3>
              <p className="text-[11px] font-mono text-slate-500">
                Sherry Zone 1 / Zone 2 Architecture · Prefix Caching · TTFT Telemetry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close KV Cache Lab"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Strategy Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setStrategy('aligned')}
              className={`p-3 rounded-xl border text-left transition-all ${
                strategy === 'aligned'
                  ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950'
                  : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {isZh ? 'Sherry Zone 1 / Zone 2 前綴對齊' : 'Sherry Zone 1 / Zone 2 Aligned'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Prefix Hit
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {isZh
                  ? '[靜態人設 + 精簡工具索引] 固定置頂，時間與動態記憶移至尾端 → Pass-2 直接命中快取。'
                  : '[Static Persona + Compact Tool Index] pinned at prefix; dynamic context at tail → Pass-2 hits cache.'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStrategy('unaligned')}
              className={`p-3 rounded-xl border text-left transition-all ${
                strategy === 'unaligned'
                  ? 'border-amber-500 bg-amber-50/80 text-amber-950'
                  : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  {isZh ? '傳統作法（前綴含動態時間戳）' : 'Naive Prompt (Timestamp at Token 0)'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Cache Bust
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {isZh
                  ? '每次請求開頭插入當前時間 → 第 1 個 Token 就不一致，整段 Prompt 被迫重新 Prefill。'
                  : 'Injecting current time at token 0 invalidates the entire prefix cache on every single turn.'}
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">
                    {isZh ? 'Zone 1 靜態前綴大小' : 'Zone 1 Static Prefix'}
                  </label>
                  <span className="font-mono text-academic-900 font-semibold">
                    {zone1Tokens.toLocaleString()} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min={1500}
                  max={8500}
                  step={500}
                  value={zone1Tokens}
                  onChange={(e) => setZone1Tokens(Number(e.target.value))}
                  className="w-full accent-academic-900"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">
                    {isZh ? 'GPU Prefill 吞吐量 (vLLM)' : 'GPU Prefill Throughput'}
                  </label>
                  <span className="font-mono text-academic-900 font-semibold">
                    {prefillSpeed.toLocaleString()} tok/s
                  </span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={6000}
                  step={200}
                  value={prefillSpeed}
                  onChange={(e) => setPrefillSpeed(Number(e.target.value))}
                  className="w-full accent-academic-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {isZh ? `目前對話輪次：Turn #${turn}（動態提問）` : `Current Turn #${turn} (Dynamic Input)`}
                </label>
                <textarea
                  rows={2}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-ink focus:outline-none focus:border-academic-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTurn((t) => t + 1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-academic-900 hover:bg-academic-700 text-white text-xs font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isZh ? '模擬下一輪請求 (Turn +1)' : 'Simulate Next Turn'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTurn(1)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-medium text-slate-700 hover:border-academic-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isZh ? '重置 (Cold Start)' : 'Cold Start'}</span>
                </button>
              </div>
            </div>

            {/* Right: Visual Token Map & Telemetry */}
            <div className="lg:col-span-7 space-y-4">
              {/* Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="text-[10px] font-mono text-slate-500">KV Cache Hit</div>
                  <div
                    className={`font-mono text-base font-bold ${
                      metrics.hitRatio > 50 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {metrics.hitRatio.toFixed(1)}%
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="text-[10px] font-mono text-slate-500">Est. TTFT</div>
                  <div
                    className={`font-mono text-base font-bold ${
                      metrics.ttftMs <= 250 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {metrics.ttftMs} ms
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="text-[10px] font-mono text-slate-500">
                    {isZh ? '省下 Prefill' : 'Cached Tok'}
                  </div>
                  <div className="font-mono text-base font-bold text-academic-900">
                    {metrics.cachedTokens.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="text-[10px] font-mono text-slate-500">
                    {isZh ? '需重算 Token' : 'Re-Prefill'}
                  </div>
                  <div className="font-mono text-base font-bold text-academic-900">
                    {metrics.prefillTokens.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Token Stream Visualization */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-slate-300 font-semibold">
                    Prompt Token Sequence ({metrics.totalTokens.toLocaleString()} tokens)
                  </span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                      KV Hit (0 ms)
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-300">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                      Re-Prefill
                    </span>
                    {strategy === 'unaligned' && (
                      <span className="inline-flex items-center gap-1 text-rose-400">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                        Timestamp Drift
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1.5">
                  {tokenBlocks.map((blk) => (
                    <div
                      key={blk.id}
                      className={`h-5 rounded transition-all duration-300 ${
                        blk.zone === 'timestamp'
                          ? 'bg-rose-500/90 animate-pulse'
                          : blk.hit
                            ? 'bg-emerald-500/85'
                            : 'bg-amber-500/80'
                      }`}
                      title={
                        blk.zone === 'timestamp'
                          ? 'Dynamic Timestamp at Token 0 (Breaks Prefix Cache)'
                          : blk.hit
                            ? 'Zone 1 Static Prefix — KV Cache Hit'
                            : 'Requires GPU Prefill'
                      }
                    />
                  ))}
                </div>

                {/* Latency Bar Comparison */}
                <div className="pt-2 border-t border-slate-800 space-y-2 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      {isZh ? '本次估算首字延遲 (TTFT)' : 'Estimated TTFT'}
                    </span>
                    <span className="text-slate-200">
                      {metrics.ttftMs} ms{' '}
                      {metrics.savedMs > 0 && (
                        <span className="text-emerald-400">(-{metrics.savedMs} ms saved)</span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.max(4, Math.min(100, (metrics.ttftMs / Math.max(metrics.unalignedTtftMs, 1)) * 100))}%`,
                      }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        metrics.ttftMs <= 250 ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {turn === 1
                  ? isZh
                    ? '❄️ Turn #1 為冷啟動（Cold Start），所有前綴尚待寫入 VRAM KV Cache；點擊「模擬下一輪請求 (Turn +1)」即可看到 Zone 1 / Zone 2 前綴命中的延遲驟降效果！'
                    : '❄️ Turn #1 is a Cold Start warming up the KV Cache. Click "Simulate Next Turn" to see Zone 1 prefix hits slash TTFT!'
                  : isZh
                    ? '⚡ 透過將靜態系統人設與 Compact Tool Index 鎖定在 Zone 1，vLLM / RadixAttention 可在 Pass-2 直接跳過數千個 Token 的 Prefill，將 TTFT 壓至 200ms 內。'
                    : '⚡ By pinning static persona & compact tool index in Zone 1, vLLM / RadixAttention skips thousands of prefill tokens on Pass-2, keeping TTFT under 200ms.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
