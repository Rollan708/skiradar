export type CurrencyCode = 'RUB' | 'KZT' | 'EUR' | 'USD';

export type CategoryCode = 'skis' | 'boots' | 'bindings' | 'helmets_goggles';

export interface StoreOffer {
  id: string;
  productId: string;
  storeId: string;
  storeName: string;
  storeCountry: string;
  storeCountryCode: 'RU' | 'KZ' | 'EU' | 'US' | string;
  storeTrustScore: number;
  shippingNote: string;
  shippingCostRub: number;
  rawTitle: string;
  priceOriginal: number;
  oldPriceOriginal: number | null;
  currencyOriginal: CurrencyCode;
  priceRub: number;
  oldPriceRub: number | null;
  landedPriceRub: number;
  pricesByCurrency: Record<CurrencyCode, number>;
  availableSizes: string[];
  inStock: boolean;
  productUrl: string;
  matchConfidence: number;
  includesBindings: boolean;
  discountPct: number;
  realDropVsAvgPct: number;
  isVerifiedDiscount: boolean;
  updatedAt: string;
}

export interface PriceHistoryPoint {
  month: string;
  minPriceRub: number;
  avgPriceRub: number;
}

export interface GoldenProduct {
  id: string;
  category: CategoryCode;
  brand: string;
  model: string;
  season: string;
  includesBindings: boolean;
  terrain: 'freeride' | 'all_mountain' | 'piste' | 'touring' | string;
  skillLevel: string;
  summary: string;
  specs: {
    tip_mm?: number;
    waist_mm?: number;
    tail_mm?: number;
    radius_m?: number;
    weight_g?: number;
    rocker_profile?: string;
    core?: string;
    flex_rating?: number;
    reference_length_cm?: number;
    included_binding_din?: number;
    flex_index?: number;
    last_mm?: number;
    sole_norm?: string;
    also_gripwalk_compatible?: boolean;
    has_tech_inserts?: boolean;
    buckle_system?: string;
    din_min?: number;
    din_max?: number;
    brake_width_mm?: number;
    compatible_norms?: string[];
    lens_vlt_pct?: number;
    lens_type?: string;
    otg_compatible?: boolean;
    mips?: boolean;
    recco?: boolean;
    certification?: string;
  };
  historicalAvgRub: number;
  offersCount: number;
  bestPriceRub: number;
  bestOffer: StoreOffer | null;
  priceSpreadPct: number;
  maxRealDiscountPct: number;
  availableSizesUnion: string[];
  availableCountries: string[];
  offers: StoreOffer[];
  priceHistory: PriceHistoryPoint[];
}

export interface DonorStore {
  id: string;
  name: string;
  country: string;
  country_code: string;
  currency: CurrencyCode;
  website_url: string;
  parser_type: string;
  status: 'healthy' | 'warning' | 'error';
  trust_score: number;
  shipping_note: string;
  shipping_cost_rub: number;
  last_synced_at: string;
}

export interface ScrapeJob {
  id: string;
  store_id: string;
  store_name: string;
  status: string;
  items_scanned: number;
  items_matched: number;
  price_drops: number;
  duration_ms: number;
  log_summary: string;
  created_at: string;
}

export interface UnmatchedQueueItem {
  id: string;
  store_id: string;
  store_name: string;
  raw_title: string;
  price: number;
  currency: CurrencyCode;
  sizes: string[];
  suggested_product_id: string | null;
  suggested_product_name: string | null;
  confidence: number;
  reason: string;
  status: string;
}
