import React, { useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  Globe,
  Play,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Link2,
  Sparkles,
} from 'lucide-react';
import type { CurrencyCode, DonorStore, ScrapeJob, UnmatchedQueueItem } from '../types';
import { formatOriginalOfferPrice } from '../utils/compatibility';

interface Props {
  onCatalogUpdated: () => void;
}

const TEST_PRESETS = [
  {
    label: 'Kant.ru (JSON-LD)',
    input: 'https://www.kant.ru/catalog/alpine-skis/atomic-bent-100-2026/',
  },
  {
    label: 'Trial-Sport (Дисконт)',
    input: 'https://trial-sport.ru/goods/k2-mindbender-99ti-2026/',
  },
  {
    label: 'Limpopo.kz (Тенге KZT)',
    input: 'https://limpopo.kz/catalog/salomon-s-pro-alpha-120-gw',
  },
  {
    label: 'Sport-Conrad (Евро EUR)',
    input: 'https://www.sport-conrad.com/en/products/salomon/qst-106.html',
  },
  {
    label: 'Сложная строка (Кириллица + мусор)',
    input: 'Г/л лыжи Атомик Бент Четлер 100 (25/26) Flat Мужские арт. AA902',
  },
  {
    label: 'Конфликт: Комплект с креплениями',
    input: 'Горные лыжи Atomic Bent 100 (2025/2026) + крепления Strive 14 GW',
  },
];

export const ScraperAdminView: React.FC<Props> = ({ onCatalogUpdated }) => {
  const [stores, setStores] = useState<DonorStore[]>([]);
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [queue, setQueue] = useState<UnmatchedQueueItem[]>([]);
  const [loadingSync, setLoadingSync] = useState<string | null>(null);

  // Live Scraper & Normalizer Tester state
  const [testInput, setTestInput] = useState(
    'https://www.kant.ru/catalog/alpine-skis/atomic-bent-100-2026/'
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  // Add Store form state
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreUrl, setNewStoreUrl] = useState('');
  const [newStoreCountry, setNewStoreCountry] = useState<'RU' | 'KZ' | 'EU' | 'US'>('KZ');
  const [newStoreCurrency, setNewStoreCurrency] = useState<CurrencyCode>('KZT');
  const [newStoreParser, setNewStoreParser] = useState('Schema.org JSON-LD + OpenGraph');

  const fetchAdminData = async () => {
    const res = await fetch('/api/admin/overview');
    if (res.ok) {
      const data = await res.json();
      setStores(data.stores || []);
      setJobs(data.jobs || []);
      setQueue(data.queue || []);
    }
  };

  useEffect(() => {
    fetchAdminData();
    handleRunTest('https://www.kant.ru/catalog/alpine-skis/atomic-bent-100-2026/', false);
  }, []);

  const handleRunTest = async (inputStr: string, saveOffer = false) => {
    setTesting(true);
    setSavedBanner(false);
    try {
      const res = await fetch('/api/scrape/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputStr, saveOffer }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
        if (saveOffer) {
          setSavedBanner(true);
          onCatalogUpdated();
        }
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSyncStore = async (storeId?: string) => {
    setLoadingSync(storeId || 'all');
    try {
      const res = await fetch('/api/scrape/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
        setJobs(data.jobs || []);
        onCatalogUpdated();
      }
    } finally {
      setLoadingSync(null);
    }
  };

  const handleResolveQueue = async (queueId: string, action: 'approve_merge' | 'reject') => {
    const res = await fetch('/api/queue/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId, action }),
    });
    if (res.ok) {
      const data = await res.json();
      setQueue(data.queue || []);
      onCatalogUpdated();
    }
  };

  const handleAddStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreUrl) return;
    const res = await fetch('/api/stores/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newStoreName,
        websiteUrl: newStoreUrl,
        countryCode: newStoreCountry,
        currency: newStoreCurrency,
        parserType: newStoreParser,
        shippingNote: 'Автоматический адаптер витрины',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setStores(data.stores || []);
      setJobs(data.jobs || []);
      setNewStoreName('');
      setNewStoreUrl('');
      setShowAddStore(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: LIVE SCRAPER & ENTITY RESOLUTION SANDBOX */}
      <div className="rounded-2xl border border-slate-800 bg-[#0B1221] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-mono text-cyan-300">
              <Cpu className="h-3.5 w-3.5" />
              Live Scraper & Entity Resolution Engine
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-white">
              Лаборатория живого парсинга и склейки карточек (Golden Record)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Вставьте реальный URL карточки товара (или грязное название из прайса) — движок извлечёт JSON-LD/DOM, нормализует бренд, ростовку, сезон, проверит флаг <code className="text-cyan-300">Flat vs С креплениями</code> и покажет точность склейки.
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Быстрые пресеты для теста:</span>
          {TEST_PRESETS.map((pr) => (
            <button
              key={pr.label}
              onClick={() => {
                setTestInput(pr.input);
                handleRunTest(pr.input, false);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 text-xs font-mono text-cyan-300 transition cursor-pointer"
            >
              {pr.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Вставьте URL товара или сырое название (например: Г/л Atomic Bent 100 25/26 Flat)..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-3 text-sm font-mono text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleRunTest(testInput, false)}
            disabled={testing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-3 text-sm transition shrink-0 cursor-pointer"
          >
            <Play className="h-4 w-4" />
            {testing ? 'Парсинг...' : 'Прогнать через пайплайн'}
          </button>
        </div>

        {/* Results Inspection Grid */}
        {testResult && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Step 1: Raw Extraction */}
            <div className="rounded-xl border border-slate-800 bg-[#070B14] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-cyan-400">
                  Шаг 1. Сбор данных (Scraper)
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                  {testResult.scraped.extractionTimeMs} мс
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Метод: <span className="text-white">{testResult.scraped.sourceMethod}</span>
              </div>
              <div className="text-xs font-mono text-white bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {testResult.scraped.rawTitle}
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Извлечённая цена:</span>
                <span className="text-emerald-400 font-bold">
                  {formatOriginalOfferPrice(
                    testResult.scraped.price,
                    testResult.scraped.currency
                  )}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Ростовки в наличии:{' '}
                <span className="text-cyan-300">
                  {testResult.scraped.availableSizes.join(', ')}
                </span>
              </div>
              <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-slate-950 p-2 text-[10px] font-mono text-slate-400 border border-slate-800/80">
                {testResult.scraped.rawMetadataSnippet}
              </pre>
            </div>

            {/* Step 2: Normalization Pipeline */}
            <div className="rounded-xl border border-slate-800 bg-[#070B14] p-4 space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase text-purple-400">
                Шаг 2. Нормализация (Entity Normalizer)
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Эталонный бренд:</span>
                  <span className="text-white font-bold">
                    {testResult.normalized.detectedBrand || 'Не найден'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Категория:</span>
                  <span className="text-cyan-300">{testResult.normalized.detectedCategory}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Ядро модели:</span>
                  <span className="text-white">{testResult.normalized.detectedModelCore}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Числовой индекс (Талия/Flex):</span>
                  <span className="text-amber-300 font-bold">
                    {testResult.normalized.detectedNumberSpec || '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Сезон:</span>
                  <span className="text-white">{testResult.normalized.detectedSeason}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Комплектация креплений:</span>
                  <span
                    className={
                      testResult.normalized.includesBindings
                        ? 'text-amber-300 font-bold'
                        : 'text-emerald-300 font-bold'
                    }
                  >
                    {testResult.normalized.includesBindings
                      ? `С креплениями (${testResult.normalized.detectedBindingName || 'Set'})`
                      : 'FLAT (Только лыжи)'}
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <div className="text-[10px] font-mono text-slate-500">Канонический ключ склейки:</div>
                <div className="mt-0.5 rounded bg-slate-900 px-2 py-1 text-[11px] font-mono text-cyan-300 break-all">
                  {testResult.normalized.canonicalKey}
                </div>
              </div>
            </div>

            {/* Step 3: Golden Record Matching Decision */}
            <div className="rounded-xl border border-slate-800 bg-[#070B14] p-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-emerald-400">
                    Шаг 3. Склейка с Golden Record
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
                      testResult.match.confidence >= 80
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    Confidence: {testResult.match.confidence}%
                  </span>
                </div>

                <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Привязка к карточке каталога:</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {testResult.match.matchedProductName || 'Новая уникальная модель (создать Golden Record)'}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  {testResult.match.reasons.map((r: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                  {testResult.match.conflicts.map((c: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-rose-300">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                {savedBanner ? (
                  <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-xs font-mono text-emerald-300 text-center">
                    ✓ Оффер успешно добавлен в карточку {testResult.match.matchedProductName}!
                  </div>
                ) : (
                  testResult.match.matchedProductId && (
                    <button
                      onClick={() => handleRunTest(testInput, true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 text-xs transition cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      Сохранить спарсенный оффер в живой каталог
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: ENTITY RESOLUTION REVIEW QUEUE */}
      <div className="rounded-2xl border border-slate-800 bg-[#0B1221] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-400" />
              Очередь полуавтоматической склейки (Entity Resolution Queue)
            </h3>
            <p className="text-xs text-slate-400">
              Спорные карточки (транслитерация, кириллица или отличие комплектации Flat vs Set), требующие подтверждения оператора.
            </p>
          </div>
          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-mono font-bold text-amber-300">
            Ожидают решения: {queue.length}
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
            Все спорные позиции обработаны! Очередь чиста.
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="font-bold text-cyan-300">{item.store_name}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-white">
                      {formatOriginalOfferPrice(item.price, item.currency)}
                    </span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300">
                      Точность: {item.confidence}%
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-white">{item.raw_title}</div>
                  <div className="text-xs text-slate-400">
                    Кандидат на склейку:{' '}
                    <span className="text-emerald-300 font-semibold">
                      {item.suggested_product_name}
                    </span>{' '}
                    • Причина: {item.reason}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleResolveQueue(item.id, 'approve_merge')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 text-xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Подтвердить склейку
                  </button>
                  <button
                    onClick={() => handleResolveQueue(item.id, 'reject')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-rose-950/60 hover:border-rose-500/40 text-slate-300 px-3.5 py-2 text-xs transition cursor-pointer"
                  >
                    <XCircle className="h-4 w-4" />
                    Разделить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: DONOR STORES MATRIX + ADD NEW DONOR + SCRAPE LOGS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 rounded-2xl border border-slate-800 bg-[#0B1221] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-cyan-400" />
                Магазины-доноры ({stores.length} подключено)
              </h3>
              <p className="text-xs text-slate-400">
                РФ, Казахстан и зарубежные дискаунтеры (адаптеры JSON-LD, YML, Playwright)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddStore(!showAddStore)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Добавить донора
              </button>
              <button
                onClick={() => handleSyncStore()}
                disabled={loadingSync !== null}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-2 text-xs transition cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loadingSync === 'all' ? 'animate-spin' : ''}`}
                />
                Синхронизировать все
              </button>
            </div>
          </div>

          {showAddStore && (
            <form
              onSubmit={handleAddStoreSubmit}
              className="rounded-xl border border-cyan-500/40 bg-slate-900/90 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <input
                type="text"
                required
                placeholder="Название магазина (напр. RiderShop KZ)"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
              <input
                type="url"
                required
                placeholder="URL витрины (https://...)"
                value={newStoreUrl}
                onChange={(e) => setNewStoreUrl(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
              <select
                value={newStoreCountry}
                onChange={(e) => setNewStoreCountry(e.target.value as any)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              >
                <option value="RU">Россия (RU)</option>
                <option value="KZ">Казахстан (KZ)</option>
                <option value="EU">Европа (EU)</option>
                <option value="US">США (US)</option>
              </select>
              <select
                value={newStoreCurrency}
                onChange={(e) => setNewStoreCurrency(e.target.value as CurrencyCode)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              >
                <option value="RUB">RUB (₽)</option>
                <option value="KZT">KZT (₸)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
              <input
                type="text"
                value={newStoreParser}
                onChange={(e) => setNewStoreParser(e.target.value)}
                placeholder="Тип адаптера"
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 text-xs cursor-pointer"
              >
                Подключить и запустить индекс
              </button>
            </form>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {stores.map((st) => (
              <div
                key={st.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        st.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-sm font-bold text-white">{st.name}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                      {st.country_code} • {st.currency}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs font-mono text-slate-400">
                    Адаптер: {st.parser_type}
                  </div>
                </div>
                <button
                  onClick={() => handleSyncStore(st.id)}
                  disabled={loadingSync !== null}
                  className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-mono text-slate-200 transition shrink-0 cursor-pointer"
                >
                  {loadingSync === st.id ? 'Обход...' : 'Обновить'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Scrape Jobs Log */}
        <div className="xl:col-span-5 rounded-2xl border border-slate-800 bg-[#0B1221] p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              Журнал задач парсинга (Scrape Jobs)
            </h3>
            <p className="text-xs text-slate-400">
              Телеметрия обхода витрин, скорость выполнения и найденные ценовые дропы
            </p>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white">{job.store_name}</span>
                  <span className="text-emerald-400">
                    {job.items_matched}/{job.items_scanned} склеено • {job.duration_ms} мс
                  </span>
                </div>
                <div className="text-xs text-slate-300">{job.log_summary}</div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Найдено скидок: {job.price_drops}</span>
                  <span>{new Date(job.created_at).toLocaleTimeString('ru-RU')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
