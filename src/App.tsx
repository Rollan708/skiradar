import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Mountain,
  Sliders,
  Cpu,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  Filter,
  Layers,
  ExternalLink,
  Check,
  Globe,
  Compass,
} from 'lucide-react';
import type { CategoryCode, CurrencyCode, DonorStore, GoldenProduct } from './types';
import { formatMoney, type RiderProfile } from './utils/compatibility';
import { SkiGraphicSvg } from './components/SkiGraphicSvg';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SetupBuilderView } from './components/SetupBuilderView';
import { GeometryCompareView } from './components/GeometryCompareView';
import { ScraperAdminView } from './components/ScraperAdminView';

type ActiveTab = 'catalog' | 'builder' | 'compare' | 'admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [currency, setCurrency] = useState<CurrencyCode>('RUB');
  const [fxRatesToRub, setFxRatesToRub] = useState<Record<CurrencyCode, number>>({
    RUB: 1,
    KZT: 0.195,
    EUR: 104.5,
    USD: 96.2,
  });

  const [products, setProducts] = useState<GoldenProduct[]>([]);
  const [stores, setStores] = useState<DonorStore[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryCode | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'RU' | 'KZ' | 'GLOBAL'>('ALL');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedTerrain, setSelectedTerrain] = useState<string>('all');
  const [onlyRealDeals, setOnlyRealDeals] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'discount' | 'price_asc' | 'spread'>('discount');

  // Modal & interactive states
  const [inspectedProduct, setInspectedProduct] = useState<GoldenProduct | null>(null);
  const [comparedIds, setComparedIds] = useState<string[]>([
    'atomic-bent-100-2526',
    'salomon-qst-106-2526',
    'k2-mindbender-99ti-2526',
  ]);

  // Setup Builder states
  const [rider, setRider] = useState<RiderProfile>({
    heightCm: 180,
    weightKg: 79,
    mondopoint: '27.5',
    skill: 'advanced',
    terrain: 'freeride',
  });
  const [selectedSki, setSelectedSki] = useState<GoldenProduct | null>(null);
  const [selectedBinding, setSelectedBinding] = useState<GoldenProduct | null>(null);
  const [selectedBoot, setSelectedBoot] = useState<GoldenProduct | null>(null);

  const loadCatalog = async () => {
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        const prods: GoldenProduct[] = data.products || [];
        setProducts(prods);
        setStores(data.stores || []);
        if (data.fxRatesToRub) {
          setFxRatesToRub(data.fxRatesToRub);
        }

        // Initialize default setup builder items if empty
        if (!selectedSki && prods.length > 0) {
          setSelectedSki(prods.find((p) => p.id === 'atomic-bent-100-2526') || prods[0]);
          setSelectedBinding(
            prods.find((p) => p.id === 'salomon-strive-14-gw') ||
              prods.find((p) => p.category === 'bindings') ||
              null
          );
          setSelectedBoot(
            prods.find((p) => p.id === 'atomic-hawx-prime-120-s-gw') ||
              prods.find((p) => p.category === 'boots') ||
              null
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleToggleCompare = (product: GoldenProduct) => {
    if (product.category !== 'skis') return;
    setComparedIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), product.id];
      }
      return [...prev, product.id];
    });
  };

  const handleAddToSetup = (product: GoldenProduct) => {
    if (product.category === 'skis') setSelectedSki(product);
    if (product.category === 'bindings') setSelectedBinding(product);
    if (product.category === 'boots') setSelectedBoot(product);
    setActiveTab('builder');
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        if (selectedTerrain !== 'all' && p.terrain !== selectedTerrain) return false;
        if (onlyRealDeals && p.maxRealDiscountPct < 15) return false;

        if (selectedRegion !== 'ALL') {
          if (selectedRegion === 'RU' && !p.availableCountries.includes('RU')) return false;
          if (selectedRegion === 'KZ' && !p.availableCountries.includes('KZ')) return false;
          if (
            selectedRegion === 'GLOBAL' &&
            !p.availableCountries.includes('EU') &&
            !p.availableCountries.includes('US')
          ) {
            return false;
          }
        }

        if (selectedSize) {
          if (!p.availableSizesUnion.includes(selectedSize)) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const haystack = `${p.brand} ${p.model} ${p.season} ${p.summary}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.bestPriceRub - b.bestPriceRub;
        if (sortBy === 'spread') return b.priceSpreadPct - a.priceSpreadPct;
        return b.maxRealDiscountPct - a.maxRealDiscountPct;
      });
  }, [
    products,
    selectedCategory,
    selectedTerrain,
    onlyRealDeals,
    selectedRegion,
    selectedSize,
    searchQuery,
    sortBy,
  ]);

  const totalOffersCount = useMemo(
    () => products.reduce((acc, p) => acc + p.offersCount, 0),
    [products]
  );

  const popularSizes = useMemo(() => {
    if (selectedCategory === 'boots') return ['26.0', '26.5', '27.0', '27.5', '28.5'];
    if (selectedCategory === 'bindings') return ['95mm', '100mm', '110mm'];
    return ['170', '172', '177', '180', '184', '186', '26.5', '27.5'];
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col">
      {/* Top Telemetry Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070B14]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Mountain className="h-6 w-6 text-slate-950 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  SKI<span className="text-cyan-400">RADAR</span>
                </span>
                <span className="rounded-md bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                  PRO AGGREGATOR v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Единый радар цен, ростовок и совместимости горнолыжного снаряжения (РФ • КЗ • Мир)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 rounded-xl bg-[#0D1526] p-1 border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Каталог и Цены ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'builder'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Сборщик сетапа + DIN
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'compare'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Геометрия ({comparedIds.length}/3)
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              Парсеры и Склейка
            </button>
          </nav>

          {/* Multi-Currency Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-[#0D1526] p-1 border border-slate-800">
            {(['RUB', 'KZT', 'EUR', 'USD'] as CurrencyCode[]).map((cur) => (
              <button
                key={cur}
                onClick={() => setCurrency(cur)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold transition cursor-pointer ${
                  currency === cur
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cur === 'RUB' && '₽ RUB'}
                {cur === 'KZT' && '₸ KZT'}
                {cur === 'EUR' && '€ EUR'}
                {cur === 'USD' && '$ USD'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6 space-y-6">
        {activeTab === 'catalog' && (
          <>
            {/* Hero Telemetry Strip */}
            <section className="rounded-2xl border border-slate-800/90 bg-gradient-to-r from-[#0C1527] via-[#0F1B33] to-[#0A1120] p-6 shadow-xl relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-emerald-300 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Индекс активен: {stores.length} магазинов • {totalOffersCount} проверенных офферов
                    </span>
                    <span className="rounded-full bg-slate-800/90 px-3 py-0.5 text-slate-300">
                      Кант • Триал-Спорт • Траектория • Спорт-Марафон • Limpopo.kz • Skadi.kz • Sport-Conrad • Evo
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Умный агрегатор горнолыжного снаряжения с проверкой ростовок и совместимости
                  </h1>
                  <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                    Склеиваем карточки разных сезонов в единый <span className="text-cyan-300 font-semibold">Golden Record</span>, отсекаем магазины без вашей ростовки, разделяем комплектацию <span className="font-mono text-emerald-300">Flat</span> и <span className="font-mono text-amber-300">С креплениями</span> и проверяем реальную историю цен без фейковых скидок.
                  </p>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-[#070B14]/85 p-3.5">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">
                      Макс. разница в цене
                    </div>
                    <div className="mt-1 text-2xl font-mono font-extrabold text-orange-400">
                      до 40%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      на одну и ту же модель лыж
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#070B14]/85 p-3.5">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">
                      Точность AI-склейки
                    </div>
                    <div className="mt-1 text-2xl font-mono font-extrabold text-cyan-400">
                      98.4%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      защита от путаницы Flat / Set
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter & Search Command Bar */}
            <section className="rounded-2xl border border-slate-800 bg-[#0B1221] p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search */}
                <div className="md:col-span-5 relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по бренду, модели или талии (напр. Atomic Bent 100, QST, Hawx)..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* Region Filter */}
                <div className="md:col-span-3">
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-cyan-400" />
                    <select
                      aria-label="Фильтр по регионам магазинов"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="ALL">🌐 Все регионы (РФ + КЗ + Мир)</option>
                      <option value="RU">🇷🇺 Магазины РФ (Кант, Триал, СМ)</option>
                      <option value="KZ">🇰🇿 Магазины Казахстана (Limpopo, Skadi)</option>
                      <option value="GLOBAL">🇪🇺/🇺🇸 Зарубежные (Sport-Conrad, Evo)</option>
                    </select>
                  </div>
                </div>

                {/* Terrain Filter */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Compass className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <select
                      aria-label="Фильтр по стилю катания"
                      value={selectedTerrain}
                      onChange={(e) => setSelectedTerrain(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="all">Все стили катания</option>
                      <option value="freeride">Фрирайд / Бэккантри</option>
                      <option value="all_mountain">All-Mountain / Универсал</option>
                      <option value="piste">Трасса / Карвинг</option>
                    </select>
                  </div>
                </div>

                {/* Sort */}
                <div className="md:col-span-2">
                  <select
                    aria-label="Сортировка каталога"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="discount">По размеру скидки (%)</option>
                    <option value="price_asc">Сначала дешевле</option>
                    <option value="spread">По разбросу цен витрин</option>
                  </select>
                </div>
              </div>

              {/* Category Pills & Real Size Stock Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Все категории' },
                      { id: 'skis', label: 'Горные лыжи' },
                      { id: 'boots', label: 'Горнолыжные ботинки' },
                      { id: 'bindings', label: 'Крепления' },
                      { id: 'helmets_goggles', label: 'Шлемы и маски' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSize('');
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Size / Length in-stock quick filter */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1 mr-1">
                    <Filter className="h-3.5 w-3.5 text-cyan-400" />
                    В наличии ростовка/размер:
                  </span>
                  {popularSizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                      className={`rounded-md px-2 py-1 text-xs font-mono font-semibold transition cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}

                  <button
                    onClick={() => setOnlyRealDeals(!onlyRealDeals)}
                    className={`ml-1 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold border transition flex items-center gap-1 cursor-pointer ${
                      onlyRealDeals
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Скидка &gt;15%
                  </button>
                </div>
              </div>
            </section>

            {/* Product Cards Grid */}
            {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-[#0B1221] p-12 text-center text-slate-400 font-mono">
                Загрузка золотых карточек и синхронизация цен магазинов...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-[#0B1221] p-12 text-center space-y-3">
                <div className="text-lg font-bold text-white">
                  По заданным фильтрам ростовки/региона моделей не найдено
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedRegion('ALL');
                    setSelectedSize('');
                    setSelectedTerrain('all');
                    setOnlyRealDeals(false);
                    setSearchQuery('');
                  }}
                  className="rounded-xl bg-cyan-500 text-slate-950 font-bold px-4 py-2 text-xs"
                >
                  Сбросить все фильтры
                </button>
              </div>
            ) : (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const isCompared = comparedIds.includes(product.id);
                  const bestOffer = product.bestOffer;

                  return (
                    <article
                      key={product.id}
                      className="group rounded-2xl border border-slate-800/90 bg-[#0B1221] hover:border-cyan-500/50 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg"
                    >
                      <div className="p-5 space-y-3">
                        {/* Card Top Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-slate-800/90 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                              {product.season}
                            </span>
                            {product.category === 'skis' && (
                              <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-mono font-bold ${
                                  product.includesBindings
                                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-800/90 text-cyan-300'
                                }`}
                              >
                                {product.includesBindings ? 'С креплениями' : 'Flat'}
                              </span>
                            )}
                          </div>

                          {product.maxRealDiscountPct > 0 && (
                            <span className="rounded-md bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-xs font-mono font-extrabold text-orange-300">
                              -{product.maxRealDiscountPct}% ВЫГОДА
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <div>
                          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                            {product.brand} • {product.terrain.toUpperCase()}
                          </div>
                          <h2
                            onClick={() => setInspectedProduct(product)}
                            className="text-lg font-extrabold text-white group-hover:text-cyan-300 transition cursor-pointer"
                          >
                            {product.model}
                          </h2>
                        </div>

                        {/* SVG Engineering Visual */}
                        <div
                          onClick={() => setInspectedProduct(product)}
                          className="rounded-xl bg-[#070B14] p-3 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition"
                        >
                          <SkiGraphicSvg product={product} />
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {product.summary}
                        </p>

                        {/* Real Sizes in Stock across stores */}
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                            <span>Доступные ростовки / размеры:</span>
                            <span className="font-mono text-cyan-300">
                              {product.offersCount} маг. ({product.availableCountries.join('/')})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {product.availableSizesUnion.map((sz) => (
                              <span
                                key={sz}
                                className={`rounded px-2 py-0.5 text-[11px] font-mono font-semibold ${
                                  selectedSize === sz
                                    ? 'bg-emerald-500 text-slate-950 font-bold'
                                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                                }`}
                              >
                                {sz}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Mini Store Preview (Top 2 Stores) */}
                        <div className="rounded-xl bg-slate-900/75 border border-slate-800/80 p-2.5 space-y-1.5">
                          {product.offers.slice(0, 2).map((off, i) => (
                            <div
                              key={off.id}
                              className="flex items-center justify-between text-xs font-mono"
                            >
                              <span className="text-slate-300 truncate max-w-[165px]">
                                {i === 0 ? '🏆 ' : '• '}
                                {off.storeName}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={
                                    i === 0 ? 'font-bold text-emerald-400' : 'text-slate-300'
                                  }
                                >
                                  {formatMoney(off.priceRub, currency, fxRatesToRub)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="border-t border-slate-800/80 bg-[#080E1B] px-5 py-3.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span>Лучшая цена</span>
                            {bestOffer && (
                              <span className="text-emerald-400 font-mono">
                                ({bestOffer.storeName.split(' ')[0]})
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-mono font-extrabold text-white">
                              {formatMoney(product.bestPriceRub, currency, fxRatesToRub)}
                            </span>
                            <span className="text-xs font-mono text-slate-400 line-through">
                              {formatMoney(product.historicalAvgRub, currency, fxRatesToRub)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {product.category === 'skis' && (
                            <button
                              onClick={() => handleToggleCompare(product)}
                              title="Сравнить геометрию"
                              className={`rounded-xl border p-2.5 text-xs transition cursor-pointer ${
                                isCompared
                                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                                  : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {isCompared ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Sliders className="h-4 w-4" />
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => setInspectedProduct(product)}
                            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-2.5 text-xs transition cursor-pointer"
                          >
                            Сравнить цены ({product.offersCount})
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {activeTab === 'builder' && (
          <SetupBuilderView
            products={products}
            currency={currency}
            fxRatesToRub={fxRatesToRub}
            rider={rider}
            onChangeRider={setRider}
            selectedSki={selectedSki}
            selectedBinding={selectedBinding}
            selectedBoot={selectedBoot}
            onSelectSki={setSelectedSki}
            onSelectBinding={setSelectedBinding}
            onSelectBoot={setSelectedBoot}
            onInspectProduct={setInspectedProduct}
          />
        )}

        {activeTab === 'compare' && (
          <GeometryCompareView
            skis={products.filter((p) => p.category === 'skis')}
            comparedIds={comparedIds}
            onToggleCompare={handleToggleCompare}
            onInspectProduct={setInspectedProduct}
            currency={currency}
            fxRatesToRub={fxRatesToRub}
          />
        )}

        {activeTab === 'admin' && <ScraperAdminView onCatalogUpdated={loadCatalog} />}
      </main>

      {/* Golden Record Detail Modal */}
      <ProductDetailModal
        product={inspectedProduct}
        currency={currency}
        fxRatesToRub={fxRatesToRub}
        selectedSizeFilter={selectedSize}
        onClose={() => setInspectedProduct(null)}
        onAddToSetup={handleAddToSetup}
        onToggleCompare={handleToggleCompare}
        isCompared={inspectedProduct ? comparedIds.includes(inspectedProduct.id) : false}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050810] py-5 px-4 sm:px-6 mt-12">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>
              SkiRadar Aggregator • Работает по модели товарной витрины (Schema.org JSON-LD + Entity Resolution Engine)
            </span>
          </div>
          <div className="font-mono">
            Курсы пересчёта: 1 € = {fxRatesToRub.EUR} ₽ • 1 $ = {fxRatesToRub.USD} ₽ • 1000 ₸ ={' '}
            {Math.round(fxRatesToRub.KZT * 1000)} ₽
          </div>
        </div>
      </footer>
    </div>
  );
}
