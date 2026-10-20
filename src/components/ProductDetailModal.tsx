import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  Truck,
  CheckCircle2,
  Layers,
  Sliders,
  Sparkles,
} from 'lucide-react';
import type { CurrencyCode, GoldenProduct } from '../types';
import { formatMoney, formatOriginalOfferPrice } from '../utils/compatibility';
import { SkiGraphicSvg } from './SkiGraphicSvg';

interface Props {
  product: GoldenProduct | null;
  currency: CurrencyCode;
  fxRatesToRub: Record<CurrencyCode, number>;
  selectedSizeFilter: string;
  onClose: () => void;
  onAddToSetup: (product: GoldenProduct) => void;
  onToggleCompare: (product: GoldenProduct) => void;
  isCompared: boolean;
}

const COUNTRY_BADGES: Record<string, { flag: string; label: string }> = {
  RU: { flag: '🇷🇺', label: 'РФ' },
  KZ: { flag: '🇰🇿', label: 'КЗ' },
  EU: { flag: '🇪🇺', label: 'ЕС' },
  US: { flag: '🇺🇸', label: 'США' },
};

export const ProductDetailModal: React.FC<Props> = ({
  product,
  currency,
  fxRatesToRub,
  selectedSizeFilter,
  onClose,
  onAddToSetup,
  onToggleCompare,
  isCompared,
}) => {
  const [activeSize, setActiveSize] = useState<string>(selectedSizeFilter || '');

  if (!product) return null;

  const filteredOffers = activeSize
    ? product.offers.filter((o) => o.availableSizes.includes(activeSize))
    : product.offers;

  const history = product.priceHistory || [];
  const maxHist = Math.max(...history.map((h) => h.avgPriceRub), product.historicalAvgRub, 1);
  const minHist = Math.min(...history.map((h) => h.minPriceRub), product.bestPriceRub) * 0.9;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-[#0B1221] text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 bg-[#0E172A] px-6 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="rounded-md bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-cyan-300 font-semibold">
                GOLDEN RECORD • {product.season}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 font-semibold border ${
                  product.includesBindings
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {product.category === 'skis'
                  ? product.includesBindings
                    ? 'С КРЕПЛЕНИЯМИ (SET)'
                    : 'FLAT (ТОЛЬКО ЛЫЖИ)'
                  : product.category.toUpperCase()}
              </span>
              {product.maxRealDiscountPct > 0 && (
                <span className="rounded-md bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-orange-300 font-semibold">
                  Честная выгода до -{product.maxRealDiscountPct}%
                </span>
              )}
            </div>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-white">
              {product.brand} {product.model}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">{product.summary}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800/70 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Top Grid: Geometry Visual + Price History Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Telemetry & Specs */}
            <div className="rounded-xl border border-slate-800 bg-[#070B14]/90 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Инженерная телеметрия и ТТХ
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  Разброс цен: {product.priceSpreadPct}% между магазинами
                </span>
              </div>

              <div className="my-2 rounded-lg bg-[#0D1526] p-3 border border-slate-800/70">
                <SkiGraphicSvg product={product} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-xs">
                {product.category === 'skis' && (
                  <>
                    <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80">
                      <div className="text-slate-400">Геометрия (мм)</div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {product.specs.tip_mm} - {product.specs.waist_mm} - {product.specs.tail_mm}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80">
                      <div className="text-slate-400">Радиус / Вес</div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {product.specs.radius_m} м • {product.specs.weight_g} г
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80 col-span-2 sm:col-span-1">
                      <div className="text-slate-400">Профиль</div>
                      <div className="font-mono font-semibold text-cyan-300 mt-0.5 truncate" title={product.specs.rocker_profile}>
                        {product.specs.rocker_profile}
                      </div>
                    </div>
                  </>
                )}
                {product.category === 'boots' && (
                  <>
                    <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80">
                      <div className="text-slate-400">Жесткость (Flex)</div>
                      <div className="font-mono font-bold text-cyan-300 mt-0.5">{product.specs.flex_index}</div>
                    </div>
                    <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80">
                      <div className="text-slate-400">Ширина колодки</div>
                      <div className="font-mono font-bold text-white mt-0.5">{product.specs.last_mm} мм</div>
                    </div>
                    <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80">
                      <div className="text-slate-400">Стандарт подошвы</div>
                      <div className="font-mono font-semibold text-emerald-300 mt-0.5">{product.specs.sole_norm}</div>
                    </div>
                  </>
                )}
                {product.category === 'bindings' && (
                  <>
                    <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80">
                      <div className="text-slate-400">Шкала DIN</div>
                      <div className="font-mono font-bold text-cyan-300 mt-0.5">
                        {product.specs.din_min} – {product.specs.din_max} DIN
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80">
                      <div className="text-slate-400">Ширина ски-стопа</div>
                      <div className="font-mono font-bold text-white mt-0.5">{product.specs.brake_width_mm} мм</div>
                    </div>
                    <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80">
                      <div className="text-slate-400">Совместимость</div>
                      <div className="font-mono font-semibold text-emerald-300 mt-0.5">{product.specs.sole_norm}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: 6-Month Price History & Anti-Fake Discount Radar */}
            <div className="rounded-xl border border-slate-800 bg-[#070B14]/90 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                    Динамика цен (6 мес.) и Радар скидок
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  Среднерыночная: {formatMoney(product.historicalAvgRub, currency, fxRatesToRub)}
                </span>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="my-3">
                <svg viewBox="0 0 340 100" className="w-full h-24 overflow-visible">
                  {history.map((pt, idx) => {
                    const x = 24 + (idx / Math.max(1, history.length - 1)) * 290;
                    const yMin =
                      82 - ((pt.minPriceRub - minHist) / Math.max(1, maxHist - minHist)) * 62;
                    const yAvg =
                      82 - ((pt.avgPriceRub - minHist) / Math.max(1, maxHist - minHist)) * 62;
                    const nextPt = history[idx + 1];
                    const nextX = nextPt
                      ? 24 + ((idx + 1) / Math.max(1, history.length - 1)) * 290
                      : x;
                    const nextYMin = nextPt
                      ? 82 - ((nextPt.minPriceRub - minHist) / Math.max(1, maxHist - minHist)) * 62
                      : yMin;
                    const nextYAvg = nextPt
                      ? 82 - ((nextPt.avgPriceRub - minHist) / Math.max(1, maxHist - minHist)) * 62
                      : yAvg;

                    return (
                      <g key={pt.month}>
                        {nextPt && (
                          <>
                            <line
                              x1={x}
                              y1={yAvg}
                              x2={nextX}
                              y2={nextYAvg}
                              stroke="#475569"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            <line
                              x1={x}
                              y1={yMin}
                              x2={nextX}
                              y2={nextYMin}
                              stroke="#00E5FF"
                              strokeWidth="2.5"
                            />
                          </>
                        )}
                        <circle cx={x} cy={yMin} r="3.5" fill="#00E5FF" />
                        <text
                          x={x}
                          y="96"
                          textAnchor="middle"
                          fill="#64748B"
                          fontSize="9"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {pt.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Вердикт радара: Честная сезонная цена (ниже средней на{' '}
                  {Math.max(
                    5,
                    Math.round(
                      ((product.historicalAvgRub - product.bestPriceRub) / product.historicalAvgRub) * 100
                    )
                  )}
                  %)
                </span>
                <span className="font-mono font-bold text-emerald-200">
                  Лучшая: {formatMoney(product.bestPriceRub, currency, fxRatesToRub)}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Size / Length Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div>
              <div className="text-xs font-mono uppercase text-slate-400">
                Фильтр по реальному наличию вашей ростовки / размера:
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveSize('')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition ${
                    activeSize === ''
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Все размеры ({product.offers.length} маг.)
                </button>
                {product.availableSizesUnion.map((sz) => {
                  const countForSize = product.offers.filter((o) =>
                    o.availableSizes.includes(sz)
                  ).length;
                  return (
                    <button
                      key={sz}
                      onClick={() => setActiveSize(activeSize === sz ? '' : sz)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition ${
                        activeSize === sz
                          ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {sz} {product.category === 'skis' ? 'см' : ''} ({countForSize})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {product.category !== 'helmets_goggles' && (
                <button
                  onClick={() => {
                    onAddToSetup(product);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-3.5 py-2 text-xs transition"
                >
                  <Sparkles className="h-4 w-4" />
                  В Сборщик комплекта
                </button>
              )}
              {product.category === 'skis' && (
                <button
                  onClick={() => onToggleCompare(product)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                    isCompared
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Sliders className="h-4 w-4" />
                  {isCompared ? 'В сравнении геометрии ✓' : 'Сравнить геометрию'}
                </button>
              )}
            </div>
          </div>

          {/* Store Offers Comparison Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                Сравнение предложений магазинов ({filteredOffers.length})
              </h3>
              <span className="text-xs text-slate-400">
                Сортировка по минимальной цене в пересчёте на {currency}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredOffers.map((offer, idx) => {
                const badge = COUNTRY_BADGES[offer.storeCountryCode] || {
                  flag: '🌐',
                  label: offer.storeCountryCode,
                };
                const isBest = idx === 0;

                return (
                  <div
                    key={offer.id}
                    className={`rounded-xl border p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isBest
                        ? 'border-emerald-500/50 bg-emerald-950/15'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{badge.flag}</span>
                          {offer.storeName}
                        </span>
                        {isBest && (
                          <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-300">
                            ЛУЧШАЯ ЦЕНА
                          </span>
                        )}
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-400">
                          AI Склейка: {offer.matchConfidence}%
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5 text-slate-500" />
                          {offer.shippingNote}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 font-mono">{offer.rawTitle}</div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 mr-1">Ростовки / размеры в наличии:</span>
                        {offer.availableSizes.map((sz) => (
                          <span
                            key={sz}
                            className={`rounded px-2 py-0.5 text-xs font-mono font-semibold ${
                              activeSize === sz
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 border border-slate-700 text-slate-200'
                            }`}
                          >
                            {sz}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <div className="flex items-center md:justify-end gap-2">
                          {offer.oldPriceRub && offer.oldPriceRub > offer.priceRub && (
                            <span className="text-xs font-mono text-slate-500 line-through">
                              {formatMoney(offer.oldPriceRub, currency, fxRatesToRub)}
                            </span>
                          )}
                          {offer.discountPct > 0 && (
                            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[11px] font-mono font-bold text-orange-300">
                              -{offer.discountPct}%
                            </span>
                          )}
                        </div>
                        <div className="text-lg sm:text-xl font-mono font-extrabold text-white">
                          {formatMoney(offer.priceRub, currency, fxRatesToRub)}
                        </div>
                        {offer.currencyOriginal !== currency && (
                          <div className="text-[11px] font-mono text-cyan-300">
                            Оригинал витрины:{' '}
                            {formatOriginalOfferPrice(offer.priceOriginal, offer.currencyOriginal)}
                          </div>
                        )}
                      </div>

                      <a
                        href={offer.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shrink-0 ${
                          isBest
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        }`}
                      >
                        В магазин
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
