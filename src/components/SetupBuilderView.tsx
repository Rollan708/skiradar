import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Calculator,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Ruler,
  Gauge,
} from 'lucide-react';
import type { CurrencyCode, GoldenProduct } from '../types';
import {
  calculateRiderRecommendation,
  evaluateSetupCompatibility,
  formatMoney,
  type RiderProfile,
} from '../utils/compatibility';
import { SkiGraphicSvg } from './SkiGraphicSvg';

interface Props {
  products: GoldenProduct[];
  currency: CurrencyCode;
  fxRatesToRub: Record<CurrencyCode, number>;
  rider: RiderProfile;
  onChangeRider: (r: RiderProfile) => void;
  selectedSki: GoldenProduct | null;
  selectedBinding: GoldenProduct | null;
  selectedBoot: GoldenProduct | null;
  onSelectSki: (p: GoldenProduct | null) => void;
  onSelectBinding: (p: GoldenProduct | null) => void;
  onSelectBoot: (p: GoldenProduct | null) => void;
  onInspectProduct: (p: GoldenProduct) => void;
}

export const SetupBuilderView: React.FC<Props> = ({
  products,
  currency,
  fxRatesToRub,
  rider,
  onChangeRider,
  selectedSki,
  selectedBinding,
  selectedBoot,
  onSelectSki,
  onSelectBinding,
  onSelectBoot,
  onInspectProduct,
}) => {
  const skisList = useMemo(() => products.filter((p) => p.category === 'skis'), [products]);
  const bindingsList = useMemo(() => products.filter((p) => p.category === 'bindings'), [products]);
  const bootsList = useMemo(() => products.filter((p) => p.category === 'boots'), [products]);

  const recommendation = useMemo(() => calculateRiderRecommendation(rider), [rider]);

  const compatibilityChecks = useMemo(
    () =>
      evaluateSetupCompatibility(
        selectedSki,
        selectedBinding,
        selectedBoot,
        rider,
        recommendation
      ),
    [selectedSki, selectedBinding, selectedBoot, rider, recommendation]
  );

  const handleAutoBuildOptimal = () => {
    // Pick best matching ski for terrain
    const matchingSki =
      skisList.find((s) => s.terrain === rider.terrain && !s.includesBindings) || skisList[0];
    onSelectSki(matchingSki || null);

    // Pick binding with brake width >= ski waist and <= ski waist + 15
    const waist = matchingSki?.specs.waist_mm || 100;
    const matchingBinding =
      bindingsList.find((b) => {
        const brk = b.specs.brake_width_mm || 100;
        return brk >= waist && brk <= waist + 15;
      }) || bindingsList[0];
    onSelectBinding(matchingSki?.includesBindings ? null : matchingBinding || null);

    // Pick boot matching flex & size
    const matchingBoot =
      bootsList.find((bt) => bt.availableSizesUnion.includes(rider.mondopoint)) || bootsList[0];
    onSelectBoot(matchingBoot || null);
  };

  const activeItems = [
    selectedSki,
    selectedSki?.includesBindings ? null : selectedBinding,
    selectedBoot,
  ].filter(Boolean) as GoldenProduct[];

  const totalBestPriceRub = activeItems.reduce((sum, item) => sum + item.bestPriceRub, 0);
  const totalHistoricalAvgRub = activeItems.reduce((sum, item) => sum + item.historicalAvgRub, 0);
  const totalSavingsRub = Math.max(0, totalHistoricalAvgRub - totalBestPriceRub);

  const hasErrors = compatibilityChecks.some((c) => c.status === 'error');

  return (
    <div className="space-y-6">
      {/* Top Banner + Rider Biometrics Calculator */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0D1628] via-[#0B1220] to-[#080D18] p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-mono text-cyan-300">
              <Calculator className="h-3.5 w-3.5" />
              PCPartPicker для горнолыжников • Стандарт ISO 11088 & ISO 23223
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-white">
              Интерактивный сборщик сетапа и проверка совместимости
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Алгоритм проверяет ширину ски-стопа креплений к талии лыжи (+0…15 мм), стандарт подошвы ботинка (GripWalk / Alpine / Pin), запас пружины DIN и наличие вашей ростовки в магазинах.
            </p>
          </div>
          <button
            onClick={handleAutoBuildOptimal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-3 text-sm shadow-lg shadow-cyan-500/20 transition shrink-0 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Подобрать идеальный сетап за 1 клик
          </button>
        </div>

        {/* Biometrics Controls + Instant Telemetry Output */}
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          <div className="xl:col-span-7 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <label className="block text-[11px] font-mono uppercase text-slate-400">
                Рост (см)
              </label>
              <input
                type="number"
                min={140}
                max={210}
                value={rider.heightCm}
                onChange={(e) =>
                  onChangeRider({ ...rider, heightCm: Number(e.target.value) || 178 })
                }
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <label className="block text-[11px] font-mono uppercase text-slate-400">
                Вес (кг)
              </label>
              <input
                type="number"
                min={40}
                max={140}
                value={rider.weightKg}
                onChange={(e) =>
                  onChangeRider({ ...rider, weightKg: Number(e.target.value) || 78 })
                }
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <label className="block text-[11px] font-mono uppercase text-slate-400">
                Размер (Mondo)
              </label>
              <select
                value={rider.mondopoint}
                onChange={(e) => onChangeRider({ ...rider, mondopoint: e.target.value })}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 font-mono text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
              >
                {['25.5', '26.0', '26.5', '27.0', '27.5', '28.0', '28.5', '29.5'].map((m) => (
                  <option key={m} value={m}>
                    {m} см
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <label className="block text-[11px] font-mono uppercase text-slate-400">
                Уровень
              </label>
              <select
                value={rider.skill}
                onChange={(e) =>
                  onChangeRider({
                    ...rider,
                    skill: e.target.value as RiderProfile['skill'],
                  })
                }
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="beginner">Новичок (Type I)</option>
                <option value="intermediate">Прогрессирующий (II)</option>
                <option value="advanced">Уверенный (III)</option>
                <option value="expert">Эксперт (III+)</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-mono uppercase text-slate-400">
                Стиль / Рельеф
              </label>
              <select
                value={rider.terrain}
                onChange={(e) =>
                  onChangeRider({
                    ...rider,
                    terrain: e.target.value as RiderProfile['terrain'],
                  })
                }
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="freeride">Фрирайд / Пухляк</option>
                <option value="all_mountain">All-Mountain 50/50</option>
                <option value="piste">Трасса / Карвинг</option>
              </select>
            </div>
          </div>

          {/* Calculated Engineering Targets */}
          <div className="xl:col-span-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3">
              <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono">
                <Ruler className="h-3.5 w-3.5" />
                Ростовка лыж
              </div>
              <div className="mt-1 text-lg sm:text-xl font-mono font-extrabold text-white">
                {recommendation.minSkiLengthCm}–{recommendation.maxSkiLengthCm} см
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Идеал: {recommendation.idealSkiLengthCm} см
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
                <Gauge className="h-3.5 w-3.5" />
                Усилие DIN
              </div>
              <div className="mt-1 text-lg sm:text-xl font-mono font-extrabold text-white">
                {recommendation.recommendedDin} DIN
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Колодка ~{recommendation.bootSoleLengthMm} мм
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3">
              <div className="flex items-center gap-1.5 text-xs text-purple-300 font-mono">
                <ShieldCheck className="h-3.5 w-3.5" />
                Флекс и Талия
              </div>
              <div className="mt-1 text-base sm:text-lg font-mono font-extrabold text-white">
                Flex {recommendation.recommendedFlexMin}–{recommendation.recommendedFlexMax}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Талия {recommendation.recommendedWaistMin}–{recommendation.recommendedWaistMax} мм
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Slot Selector (Skis, Bindings, Boots) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SLOT 1: SKIS */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B1221] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                1. СЛОТ: ГОРНЫЕ ЛЫЖИ
              </span>
              {selectedSki && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                  Талия {selectedSki.specs.waist_mm} мм
                </span>
              )}
            </div>

            <select
              value={selectedSki?.id || ''}
              onChange={(e) => {
                const found = skisList.find((s) => s.id === e.target.value) || null;
                onSelectSki(found);
              }}
              className="mt-3 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm font-semibold text-white focus:border-cyan-400 focus:outline-none"
            >
              {skisList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.brand} {s.model} ({s.season}) — талия {s.specs.waist_mm}мм — от{' '}
                  {formatMoney(s.bestPriceRub, currency, fxRatesToRub)}
                </option>
              ))}
            </select>

            {selectedSki && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-[#070B14] p-3 border border-slate-800/80">
                  <SkiGraphicSvg product={selectedSki} compact />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-slate-400">Ростовки в наличии:</span>
                  {selectedSki.availableSizesUnion.map((sz) => {
                    const n = parseInt(sz, 10);
                    const isIdeal =
                      n >= recommendation.minSkiLengthCm && n <= recommendation.maxSkiLengthCm;
                    return (
                      <span
                        key={sz}
                        className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                          isIdeal
                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sz} {isIdeal ? '✓' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {selectedSki && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">
                  Лучшая цена ({selectedSki.bestOffer?.storeName}):
                </div>
                <div className="text-lg font-mono font-extrabold text-emerald-400">
                  {formatMoney(selectedSki.bestPriceRub, currency, fxRatesToRub)}
                </div>
              </div>
              <button
                onClick={() => onInspectProduct(selectedSki)}
                className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition"
              >
                Все офферы ({selectedSki.offersCount})
              </button>
            </div>
          )}
        </div>

        {/* SLOT 2: BINDINGS */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B1221] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                2. СЛОТ: КРЕПЛЕНИЯ
              </span>
              {selectedSki?.includesBindings ? (
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-mono text-emerald-300">
                  В комплекте с лыжей
                </span>
              ) : (
                selectedBinding && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                    Ски-стоп {selectedBinding.specs.brake_width_mm} мм
                  </span>
                )
              )}
            </div>

            {selectedSki?.includesBindings ? (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 text-xs text-emerald-200 space-y-2">
                <div className="font-bold text-sm text-white">
                  Крепления интегрированы в {selectedSki.brand} {selectedSki.model}
                </div>
                <p>
                  В стоимость комплекта уже входят рельсовые крепления (DIN до{' '}
                  {selectedSki.specs.included_binding_din || 12}, совместимы с GripWalk и Alpine).
                </p>
              </div>
            ) : (
              <>
                <select
                  value={selectedBinding?.id || ''}
                  onChange={(e) => {
                    const found = bindingsList.find((b) => b.id === e.target.value) || null;
                    onSelectBinding(found);
                  }}
                  className="mt-3 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm font-semibold text-white focus:border-cyan-400 focus:outline-none"
                >
                  {bindingsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brand} {b.model} — от{' '}
                      {formatMoney(b.bestPriceRub, currency, fxRatesToRub)}
                    </option>
                  ))}
                </select>

                {selectedBinding && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-[#070B14] p-3 border border-slate-800/80">
                      <SkiGraphicSvg product={selectedBinding} compact />
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Поддержка подошв: {selectedBinding.specs.compatible_norms?.join(' • ')}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {!selectedSki?.includesBindings && selectedBinding && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">
                  Лучшая цена ({selectedBinding.bestOffer?.storeName}):
                </div>
                <div className="text-lg font-mono font-extrabold text-emerald-400">
                  {formatMoney(selectedBinding.bestPriceRub, currency, fxRatesToRub)}
                </div>
              </div>
              <button
                onClick={() => onInspectProduct(selectedBinding)}
                className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition"
              >
                Все офферы ({selectedBinding.offersCount})
              </button>
            </div>
          )}
        </div>

        {/* SLOT 3: BOOTS */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B1221] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                3. СЛОТ: БОТИНКИ
              </span>
              {selectedBoot && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                  Flex {selectedBoot.specs.flex_index} • {selectedBoot.specs.last_mm} мм
                </span>
              )}
            </div>

            <select
              value={selectedBoot?.id || ''}
              onChange={(e) => {
                const found = bootsList.find((b) => b.id === e.target.value) || null;
                onSelectBoot(found);
              }}
              className="mt-3 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm font-semibold text-white focus:border-cyan-400 focus:outline-none"
            >
              {bootsList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand} {b.model} (Flex {b.specs.flex_index}) — от{' '}
                  {formatMoney(b.bestPriceRub, currency, fxRatesToRub)}
                </option>
              ))}
            </select>

            {selectedBoot && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-[#070B14] p-3 border border-slate-800/80">
                  <SkiGraphicSvg product={selectedBoot} compact />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-slate-400">Размеры (Mondo):</span>
                  {selectedBoot.availableSizesUnion.map((sz) => {
                    const isUserSize = sz === rider.mondopoint;
                    return (
                      <span
                        key={sz}
                        className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                          isUserSize
                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sz} {isUserSize ? '✓' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {selectedBoot && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">
                  Лучшая цена ({selectedBoot.bestOffer?.storeName}):
                </div>
                <div className="text-lg font-mono font-extrabold text-emerald-400">
                  {formatMoney(selectedBoot.bestPriceRub, currency, fxRatesToRub)}
                </div>
              </div>
              <button
                onClick={() => onInspectProduct(selectedBoot)}
                className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition"
              >
                Все офферы ({selectedBoot.offersCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compatibility Matrix + Smart Multi-Store Cart Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Engineering Compatibility Matrix */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#0B1221] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Протокол инженерной проверки совместимости ({compatibilityChecks.length} проверок)
            </h3>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-mono font-bold ${
                hasErrors
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {hasErrors ? 'ОБНАРУЖЕН КОНФЛИКТ' : '100% СОВМЕСТИМО'}
            </span>
          </div>

          <div className="space-y-2.5">
            {compatibilityChecks.map((chk) => (
              <div
                key={chk.id}
                className={`rounded-xl border p-3.5 flex items-start gap-3 ${
                  chk.status === 'pass'
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : chk.status === 'warning'
                    ? 'border-amber-500/30 bg-amber-950/15'
                    : 'border-rose-500/40 bg-rose-950/20'
                }`}
              >
                {chk.status === 'pass' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {chk.status === 'warning' && (
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                {chk.status === 'error' && (
                  <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-white">{chk.title}</div>
                  <div className="mt-0.5 text-xs text-slate-300 leading-relaxed">{chk.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Multi-Store Price Optimizer */}
        <div className="lg:col-span-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#0E192D] to-[#09101E] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-300">
              <ShoppingBag className="h-4 w-4" />
              Оптимизатор закупки по магазинам
            </div>
            <h3 className="mt-1 text-lg font-bold text-white">
              Лучшая сборка по минимальным ценам витрин
            </h3>

            <div className="mt-4 space-y-2.5">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-white">
                      {item.brand} {item.model}
                    </div>
                    <div className="text-[11px] text-cyan-300 font-mono">
                      Магазин: {item.bestOffer?.storeName} ({item.bestOffer?.storeCountry})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {formatMoney(item.bestPriceRub, currency, fxRatesToRub)}
                    </div>
                    {item.bestOffer && (
                      <a
                        href={item.bestOffer.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        Перейти <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Среднерыночная стоимость комплекта:</span>
              <span className="font-mono line-through">
                {formatMoney(totalHistoricalAvgRub, currency, fxRatesToRub)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span>Экономия через агрегатор SkiRadar:</span>
              <span className="font-mono">
                -{formatMoney(totalSavingsRub, currency, fxRatesToRub)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-white">Итого за полный сетап:</span>
              <span className="text-2xl font-mono font-extrabold text-cyan-300">
                {formatMoney(totalBestPriceRub, currency, fxRatesToRub)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
