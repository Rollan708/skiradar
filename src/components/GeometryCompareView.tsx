import React from 'react';
import { Sliders, Plus, Trash2, Sparkles } from 'lucide-react';
import type { CurrencyCode, GoldenProduct } from '../types';
import { formatMoney } from '../utils/compatibility';

interface Props {
  skis: GoldenProduct[];
  comparedIds: string[];
  onToggleCompare: (product: GoldenProduct) => void;
  onInspectProduct: (product: GoldenProduct) => void;
  currency: CurrencyCode;
  fxRatesToRub: Record<CurrencyCode, number>;
}

const OVERLAY_COLORS = ['#00E5FF', '#FF5500', '#10B981'];

export const GeometryCompareView: React.FC<Props> = ({
  skis,
  comparedIds,
  onToggleCompare,
  onInspectProduct,
  currency,
  fxRatesToRub,
}) => {
  const comparedSkis = skis.filter((s) => comparedIds.includes(s.id));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-[#0B1221] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-mono text-cyan-300">
              <Sliders className="h-3.5 w-3.5" />
              Soothski-Style Engineering Overlay
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-white">
              Визуальное наложение геометрии, жесткости и цен лыж
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Сравните до 3 моделей лыж бок о бок: контур бокового выреза (носок / талия / пятка), радиус поворота, вес пары и минимальную цену по магазинам.
            </p>
          </div>

          {/* Quick model selector pills */}
          <div className="flex flex-wrap gap-1.5 max-w-xl">
            {skis.map((ski) => {
              const active = comparedIds.includes(ski.id);
              return (
                <button
                  key={ski.id}
                  onClick={() => onToggleCompare(ski)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold transition flex items-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {active ? <Trash2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {ski.brand} {ski.model.replace(' (Прошлый сезон)', ' 24/25')}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Superimposed Ski Profile Overlay */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-[#070B14] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Суперпозиция контуров лыж (Масштаб бокового выреза 3:1 для наглядности)
            </span>
            <div className="flex flex-wrap gap-4">
              {comparedSkis.map((ski, idx) => (
                <div key={ski.id} className="flex items-center gap-2 text-xs font-mono">
                  <span
                    className="h-3 w-3 rounded-full inline-block"
                    style={{ backgroundColor: OVERLAY_COLORS[idx % OVERLAY_COLORS.length] }}
                  />
                  <span className="font-bold text-white">
                    {ski.brand} {ski.model}
                  </span>
                  <span className="text-slate-400">
                    ({ski.specs.tip_mm}-{ski.specs.waist_mm}-{ski.specs.tail_mm} мм)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 700 170" className="w-full h-44 select-none">
            {/* Reference engineering grid */}
            <line x1="70" y1="15" x2="70" y2="155" stroke="#1E293B" strokeDasharray="4 4" />
            <line x1="350" y1="15" x2="350" y2="155" stroke="#334155" strokeDasharray="4 4" />
            <line x1="630" y1="15" x2="630" y2="155" stroke="#1E293B" strokeDasharray="4 4" />
            <line x1="30" y1="85" x2="670" y2="85" stroke="#1E293B" />

            <text x="70" y="14" textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">
              НОСОК (TIP)
            </text>
            <text x="350" y="14" textAnchor="middle" fill="#00E5FF" fontSize="10" fontFamily="JetBrains Mono">
              ЦЕНТР / ТАЛИЯ (WAIST)
            </text>
            <text x="630" y="14" textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">
              ПЯТКА (TAIL)
            </text>

            {comparedSkis.map((ski, idx) => {
              const color = OVERLAY_COLORS[idx % OVERLAY_COLORS.length];
              const tip = ski.specs.tip_mm || 130;
              const waist = ski.specs.waist_mm || 98;
              const tail = ski.specs.tail_mm || 120;

              const tipH = (tip - 55) * 0.68;
              const waistH = (waist - 55) * 0.68;
              const tailH = (tail - 55) * 0.68;

              return (
                <path
                  key={ski.id}
                  d={`
                    M 38 85
                    Q 48 ${85 - tipH}, 85 ${85 - tipH}
                    Q 350 ${85 - waistH}, 615 ${85 - tailH}
                    Q 655 ${85 - tailH * 0.6}, 660 85
                    Q 655 ${85 + tailH * 0.6}, 615 ${85 + tailH}
                    Q 350 ${85 + waistH}, 85 ${85 + tipH}
                    Q 48 ${85 + tipH}, 38 85
                    Z
                  `}
                  fill={color}
                  fillOpacity="0.12"
                  stroke={color}
                  strokeWidth="2.5"
                />
              );
            })}
          </svg>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparedSkis.map((ski, idx) => {
            const color = OVERLAY_COLORS[idx % OVERLAY_COLORS.length];
            return (
              <div
                key={ski.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-mono font-bold text-slate-950"
                      style={{ backgroundColor: color }}
                    >
                      МОДЕЛЬ #{idx + 1} • {ski.season}
                    </span>
                    <button
                      onClick={() => onToggleCompare(ski)}
                      className="text-xs text-slate-400 hover:text-rose-400"
                    >
                      Убрать
                    </button>
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-white">
                    {ski.brand} {ski.model}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Талия (Waist):</span>
                      <span className="font-bold text-cyan-300">{ski.specs.waist_mm} мм</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Носок / Пятка:</span>
                      <span className="text-white">
                        {ski.specs.tip_mm} / {ski.specs.tail_mm} мм
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Радиус бокового выреза:</span>
                      <span className="text-white">{ski.specs.radius_m} м</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Вес одной лыжи:</span>
                      <span className="text-white">{ski.specs.weight_g} г</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Индекс жесткости:</span>
                      <span className="text-amber-300">{ski.specs.flex_rating || 8}/10</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Ростовки в наличии:</span>
                      <span className="text-emerald-300">{ski.availableSizesUnion.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Лучший оффер:</div>
                    <div className="text-lg font-mono font-extrabold text-white">
                      {formatMoney(ski.bestPriceRub, currency, fxRatesToRub)}
                    </div>
                  </div>
                  <button
                    onClick={() => onInspectProduct(ski)}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-semibold text-cyan-300 transition cursor-pointer"
                  >
                    Сравнить {ski.offersCount} цен
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
