export interface NormalizedEntityResult {
  rawTitle: string;
  cleanedTitle: string;
  detectedBrand: string | null;
  detectedCategory: 'skis' | 'boots' | 'bindings' | 'helmets_goggles';
  detectedModelCore: string;
  detectedNumberSpec: number | null; // waist_mm for skis, flex for boots, max DIN for bindings
  detectedSeason: string;
  includesBindings: boolean;
  detectedBindingName: string | null;
  soleNorm: 'GripWalk (ISO 23223)' | 'Alpine (ISO 5355)' | 'Touring (ISO 9523 / Pin)' | 'Multi-Norm (MNC/MN)' | null;
  canonicalKey: string;
  tokens: string[];
  warnings: string[];
}

export interface ProductCandidate {
  id: string;
  brand: string;
  model: string;
  category: 'skis' | 'boots' | 'bindings' | 'helmets_goggles';
  season: string;
  includes_bindings: number;
  specs: Record<string, any>;
}

export interface MatchExplanation {
  matchedProductId: string | null;
  matchedProductName: string | null;
  confidence: number; // 0..100
  status: 'auto_merged' | 'needs_review' | 'new_product';
  reasons: string[];
  conflicts: string[];
}

const BRAND_DICTIONARY: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'Atomic', aliases: ['atomic', 'атомик'] },
  { canonical: 'Salomon', aliases: ['salomon', 'саломон'] },
  { canonical: 'Head', aliases: ['head', 'хэд', 'хед'] },
  { canonical: 'Rossignol', aliases: ['rossignol', 'россиньол', 'россиньёл'] },
  { canonical: 'Fischer', aliases: ['fischer', 'фишер'] },
  { canonical: 'Völkl', aliases: ['volkl', 'völkl', 'voelkl', 'фекл', 'фёкл'] },
  { canonical: 'Elan', aliases: ['elan', 'элан'] },
  { canonical: 'K2', aliases: ['k2', 'к2'] },
  { canonical: 'Armada', aliases: ['armada', 'армада'] },
  { canonical: 'Black Crows', aliases: ['black crows', 'блэк кроус'] },
  { canonical: 'Nordica', aliases: ['nordica', 'нордика'] },
  { canonical: 'Tecnica', aliases: ['tecnica', 'техника'] },
  { canonical: 'Dalbello', aliases: ['dalbello', 'далбелло'] },
  { canonical: 'Lange', aliases: ['lange', 'ланге'] },
  { canonical: 'Marker', aliases: ['marker', 'маркер'] },
  { canonical: 'Look', aliases: ['look', 'лук'] },
  { canonical: 'Tyrolia', aliases: ['tyrolia', 'тиролия'] },
  { canonical: 'Oakley', aliases: ['oakley', 'окли'] },
  { canonical: 'Smith', aliases: ['smith', 'смит'] },
  { canonical: 'POC', aliases: ['poc', 'пок'] },
];

const NOISE_WORDS = [
  'горные лыжи',
  'горнолыжные ботинки',
  'крепления горнолыжные',
  'горнолыжный шлем',
  'маска горнолыжная',
  'г/л',
  'лыжи',
  'ботинки',
  'крепления',
  'шлем',
  'маска',
  'очки',
  'мужские',
  'женские',
  'унисекс',
  'unisex',
  'men',
  "men's",
  'ski',
  'skis',
  'boots',
  'bindings',
  'alpine',
  'комплект',
  'сезон',
  'арт.',
  'артикул',
];

const BINDING_INDICATORS = [
  /\+\s*([a-zA-Zа-яА-Я0-9\s\-]{3,20})/i,
  /\bw\/\s*([a-zA-Z0-9\s\-]{3,20})/i,
  /\bwith\s+([a-zA-Z0-9\s\-]{3,20})\s+bindings?/i,
  /\b(emx\s*\d+|m\s*1[0123]\s*gw|strive\s*1[12346]|attack\s*1[1234]|spx\s*1[235]|nx\s*1[12]|rs\s*1[01234]|pr\s*11\s*gw|squire\s*11|griffon\s*13)\b/i,
];

export function normalizeRawTitle(rawTitle: string): NormalizedEntityResult {
  const warnings: string[] = [];
  const lower = rawTitle.toLowerCase().trim();

  // 1. Detect category
  let detectedCategory: 'skis' | 'boots' | 'bindings' | 'helmets_goggles' = 'skis';
  if (
    /(ботин|boot|hawx|promachine|mach1|panterra|shadow|shift pro|s\/pro|krypton)/i.test(rawTitle)
  ) {
    detectedCategory = 'boots';
  } else if (
    /(креплен|binding|griffon|jester|squire|pivot|strive|warden|attack\s*1[1234]|alpinist|duke\s*pt|kingpin)/i.test(
      rawTitle
    ) &&
    !/(лыжи|ski\s+set|bent|qst|maverick|mantra|enforcer|mindbender|declivity|kore|ripost|ripstick| revolt)/i.test(
      rawTitle
    )
  ) {
    detectedCategory = 'bindings';
  } else if (/(шлем|маск|очки|goggle|helmet|flight deck|line miner|fornix|obex|4d mag)/i.test(rawTitle)) {
    detectedCategory = 'helmets_goggles';
  }

  // 2. Detect brand
  let detectedBrand: string | null = null;
  for (const b of BRAND_DICTIONARY) {
    for (const alias of b.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Zа-яА-Я0-9])${escaped}($|[^a-zA-Zа-яА-Я0-9])`, 'i');
      if (regex.test(lower)) {
        detectedBrand = b.canonical;
        break;
      }
    }
    if (detectedBrand) break;
  }

  if (!detectedBrand) {
    warnings.push('Бренд не распознан по словарю эталонов');
  }

  // 3. Detect Season (e.g. 24/25, 2024/2025, 2025-2026, (2025), 25-26)
  let detectedSeason = '2025/2026';
  const seasonMatch = rawTitle.match(/\b(202[3-6])\s*[\/\-]\s*(202[4-7]|[2-7][0-9])\b|\b(2[3-6])\s*[\/\-]\s*(2[4-7])\b/);
  if (seasonMatch) {
    if (seasonMatch[1] && seasonMatch[2]) {
      const y1 = seasonMatch[1];
      const y2 = seasonMatch[2].length === 2 ? `20${seasonMatch[2]}` : seasonMatch[2];
      detectedSeason = `${y1}/${y2}`;
    } else if (seasonMatch[3] && seasonMatch[4]) {
      detectedSeason = `20${seasonMatch[3]}/20${seasonMatch[4]}`;
    }
  } else {
    const singleYearMatch = rawTitle.match(/\b(2024|2025|2026)\b/);
    if (singleYearMatch) {
      const yr = Number(singleYearMatch[1]);
      detectedSeason = `${yr - 1}/${yr}`;
    }
  }

  // 4. Detect Bindings included vs Flat (crucial for skis!)
  let includesBindings = false;
  let detectedBindingName: string | null = null;
  if (detectedCategory === 'skis') {
    const isExplicitFlat = /\b(flat|без\s+креплен|только\s+лыжи|ski\s+only)\b/i.test(rawTitle);
    for (const pattern of BINDING_INDICATORS) {
      const m = rawTitle.match(pattern);
      if (m) {
        includesBindings = true;
        detectedBindingName = (m[1] || m[0]).replace(/^\+\s*/, '').trim();
        break;
      }
    }
    if (isExplicitFlat && includesBindings) {
      warnings.push('Конфликт комплектации: в названии есть и Flat, и индекс креплений');
    }
  }

  // 5. Detect Sole Norm
  let soleNorm: NormalizedEntityResult['soleNorm'] = null;
  if (/\b(mnc|mn|multi[\s\-]?norm|sole\.id)\b/i.test(rawTitle)) {
    soleNorm = 'Multi-Norm (MNC/MN)';
  } else if (/\b(pin|tech|dynafit|iso\s*9523|touring)\b/i.test(rawTitle)) {
    soleNorm = 'Touring (ISO 9523 / Pin)';
  } else if (/\b(gw|grip\s*walk|iso\s*23223)\b/i.test(rawTitle)) {
    soleNorm = 'GripWalk (ISO 23223)';
  } else if (/\b(alpine|iso\s*5355)\b/i.test(rawTitle)) {
    soleNorm = 'Alpine (ISO 5355)';
  }

  // 6. Clean title & extract core model tokens
  let working = rawTitle
    .replace(/\((202[3-6][\/\-]?[0-9]*|[2-6][0-9][\/\-][2-6][0-9])\)/gi, ' ')
    .replace(/\b(202[3-6])\s*[\/\-]\s*(202[4-7]|[2-7][0-9])\b/gi, ' ')
    .replace(/\b(2[3-6])\s*[\/\-]\s*(2[4-7])\b/gi, ' ')
    .replace(/\+\s*[a-zA-Zа-яА-Я0-9\s\-]{3,20}$/i, ' ')
    .replace(/\b(flat|без\s+креплений|только\s+лыжи)\b/gi, ' ');

  for (const w of NOISE_WORDS) {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    working = working.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'gi'), ' ');
  }

  if (detectedBrand) {
    const bObj = BRAND_DICTIONARY.find((b) => b.canonical === detectedBrand);
    if (bObj) {
      for (const alias of bObj.aliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        working = working.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'gi'), ' ');
      }
    }
  }

  // Normalize famous line aliases (e.g. "Bent Chetler 100" -> "Bent 100")
  working = working
    .replace(/\bbent\s+chetler\s+(85|90|100|110)\b/gi, 'Bent $1')
    .replace(/[()[\],/\\""«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract main number spec (waist width 65..135 for skis, flex 60..140 for boots, DIN 10..18 for bindings)
  let detectedNumberSpec: number | null = null;
  const numMatches = working.match(/\b(\d{2,3})\b/g);
  if (numMatches) {
    for (const nm of numMatches) {
      const val = Number(nm);
      if (detectedCategory === 'skis' && val >= 65 && val <= 132) {
        detectedNumberSpec = val;
        break;
      }
      if (detectedCategory === 'boots' && val >= 60 && val <= 140 && val % 5 === 0) {
        detectedNumberSpec = val;
        break;
      }
      if (detectedCategory === 'bindings' && val >= 9 && val <= 18) {
        detectedNumberSpec = val;
        break;
      }
    }
  }

  const tokens = working
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0 && !['gw', 'black', 'white', 'blue', 'red', 'green', 'orange'].includes(t));

  const canonicalKey = [
    (detectedBrand || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, ''),
    detectedCategory,
    tokens.join('-').replace(/[^a-z0-9а-я\-]/g, ''),
    includesBindings ? 'set' : 'flat',
  ].join('::');

  return {
    rawTitle,
    cleanedTitle: working,
    detectedBrand,
    detectedCategory,
    detectedModelCore: working,
    detectedNumberSpec,
    detectedSeason,
    includesBindings,
    detectedBindingName,
    soleNorm,
    canonicalKey,
    tokens,
    warnings,
  };
}

export function matchNormalizedToCatalog(
  norm: NormalizedEntityResult,
  catalog: ProductCandidate[]
): MatchExplanation {
  let bestScore = 0;
  let bestCandidate: ProductCandidate | null = null;
  let bestReasons: string[] = [];
  let bestConflicts: string[] = [];

  for (const item of catalog) {
    let score = 0;
    const reasons: string[] = [];
    const conflicts: string[] = [];

    if (item.category !== norm.detectedCategory) {
      continue;
    }

    // 1. Brand check (up to 30 pts)
    if (norm.detectedBrand && item.brand.toLowerCase() === norm.detectedBrand.toLowerCase()) {
      score += 30;
      reasons.push(`Точное совпадение бренда: ${item.brand} (+30%)`);
    } else if (norm.detectedBrand && item.brand.toLowerCase() !== norm.detectedBrand.toLowerCase()) {
      conflicts.push(`Разные бренды: ${norm.detectedBrand} vs ${item.brand}`);
      continue;
    }

    // 2. Model token overlap (up to 45 pts)
    const itemNorm = normalizeRawTitle(`${item.brand} ${item.model}`);
    const itemTokens = new Set(itemNorm.tokens);
    let matchedTokens = 0;
    for (const tk of norm.tokens) {
      if (itemTokens.has(tk)) {
        matchedTokens++;
      }
    }
    const denom = Math.max(itemTokens.size, norm.tokens.length, 1);
    const tokenRatio = matchedTokens / denom;
    if (tokenRatio > 0) {
      const pts = Math.round(tokenRatio * 45);
      score += pts;
      reasons.push(`Совпадение токенов модели (${matchedTokens}/${denom}) (+${pts}%)`);
    }

    // 3. Key numerical spec (Waist / Flex / DIN) (up to 15 pts)
    const itemSpecNum =
      item.specs.waist_mm || item.specs.flex_index || item.specs.din_max || itemNorm.detectedNumberSpec;
    if (norm.detectedNumberSpec && itemSpecNum) {
      if (Number(norm.detectedNumberSpec) === Number(itemSpecNum)) {
        score += 15;
        reasons.push(`Совпадение ключевого индекса (${norm.detectedNumberSpec}) (+15%)`);
      } else {
        score -= 25;
        conflicts.push(
          `Разный числовой индекс модели: ${norm.detectedNumberSpec} vs ${itemSpecNum} (-25%)`
        );
      }
    }

    // 4. Bindings flag for skis (up to 10 pts)
    if (item.category === 'skis') {
      const itemHasBindings = Boolean(item.includes_bindings);
      if (itemHasBindings === norm.includesBindings) {
        score += 10;
        reasons.push(
          `Комплектация совпадает (${itemHasBindings ? 'С креплениями' : 'Flat / Без креплений'}) (+10%)`
        );
      } else {
        score -= 20;
        conflicts.push(
          `Разная комплектация: оффер "${norm.includesBindings ? 'С креплениями' : 'Flat'}", а карточка "${
            itemHasBindings ? 'С креплениями' : 'Flat'
          }" (-20%)`
        );
      }
    } else {
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = item;
      bestReasons = reasons;
      bestConflicts = conflicts;
    }
  }

  const clamped = Math.max(0, Math.min(100, bestScore));
  let status: MatchExplanation['status'] = 'new_product';
  if (clamped >= 80) {
    status = 'auto_merged';
  } else if (clamped >= 50) {
    status = 'needs_review';
  }

  return {
    matchedProductId: bestCandidate && clamped >= 50 ? bestCandidate.id : null,
    matchedProductName:
      bestCandidate && clamped >= 50 ? `${bestCandidate.brand} ${bestCandidate.model}` : null,
    confidence: clamped,
    status,
    reasons: bestReasons,
    conflicts: bestConflicts,
  };
}
