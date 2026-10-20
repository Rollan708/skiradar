import type { CurrencyCode, GoldenProduct } from '../types';

export interface RiderProfile {
  heightCm: number;
  weightKg: number;
  mondopoint: string;
  skill: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  terrain: 'piste' | 'all_mountain' | 'freeride';
}

export interface RiderRecommendation {
  minSkiLengthCm: number;
  maxSkiLengthCm: number;
  idealSkiLengthCm: number;
  recommendedDin: number;
  recommendedFlexMin: number;
  recommendedFlexMax: number;
  recommendedWaistMin: number;
  recommendedWaistMax: number;
  bootSoleLengthMm: number;
}

export interface CompatibilityCheckItem {
  id: string;
  title: string;
  status: 'pass' | 'warning' | 'error';
  detail: string;
}

export function calculateRiderRecommendation(rider: RiderProfile): RiderRecommendation {
  // 1. Ski length calculation based on height, weight, skill, and terrain
  let offset = -5;
  if (rider.skill === 'beginner') offset = -12;
  if (rider.skill === 'intermediate') offset = -6;
  if (rider.skill === 'advanced') offset = 0;
  if (rider.skill === 'expert') offset = 3;

  if (rider.terrain === 'freeride') offset += 4;
  if (rider.terrain === 'piste') offset -= 5;
  if (rider.weightKg > 88) offset += 3;
  if (rider.weightKg < 62) offset -= 3;

  const idealSkiLengthCm = Math.round(rider.heightCm + offset);
  const minSkiLengthCm = idealSkiLengthCm - 4;
  const maxSkiLengthCm = idealSkiLengthCm + 4;

  // 2. Approximate Boot Sole Length (BSL in mm) from Mondopoint (e.g. 27.5 -> ~315 mm)
  const mondoNum = parseFloat(rider.mondopoint) || 27.5;
  const bootSoleLengthMm = Math.round(mondoNum * 10 + 40);

  // 3. ISO 11088 inspired DIN calculation
  let baseDin = 6.0;
  if (rider.weightKg < 55) baseDin = 4.0;
  else if (rider.weightKg < 67) baseDin = 5.0;
  else if (rider.weightKg < 79) baseDin = 6.0;
  else if (rider.weightKg < 95) baseDin = 7.0;
  else baseDin = 8.0;

  // Adjust for Skier Type (Type I / II / III / III+)
  if (rider.skill === 'beginner') baseDin -= 1.0;
  if (rider.skill === 'advanced') baseDin += 1.5;
  if (rider.skill === 'expert') baseDin += 2.5;

  // Adjust for longer boot sole lever arm
  if (bootSoleLengthMm > 330) baseDin -= 0.5;
  if (bootSoleLengthMm <= 290) baseDin += 0.5;

  const recommendedDin = Math.max(3.5, Math.min(13.0, Math.round(baseDin * 2) / 2));

  // 4. Recommended Boot Flex & Ski Waist
  let recommendedFlexMin = 90;
  let recommendedFlexMax = 110;
  if (rider.skill === 'beginner') {
    recommendedFlexMin = 70;
    recommendedFlexMax = 90;
  } else if (rider.skill === 'intermediate') {
    recommendedFlexMin = 95;
    recommendedFlexMax = 115;
  } else if (rider.skill === 'advanced') {
    recommendedFlexMin = 110;
    recommendedFlexMax = 125;
  } else {
    recommendedFlexMin = 120;
    recommendedFlexMax = 140;
  }

  let recommendedWaistMin = 88;
  let recommendedWaistMax = 102;
  if (rider.terrain === 'piste') {
    recommendedWaistMin = 70;
    recommendedWaistMax = 84;
  } else if (rider.terrain === 'freeride') {
    recommendedWaistMin = 98;
    recommendedWaistMax = 112;
  }

  return {
    minSkiLengthCm,
    maxSkiLengthCm,
    idealSkiLengthCm,
    recommendedDin,
    recommendedFlexMin,
    recommendedFlexMax,
    recommendedWaistMin,
    recommendedWaistMax,
    bootSoleLengthMm,
  };
}

export function evaluateSetupCompatibility(
  ski: GoldenProduct | null,
  binding: GoldenProduct | null,
  boot: GoldenProduct | null,
  rider: RiderProfile,
  rec: RiderRecommendation
): CompatibilityCheckItem[] {
  const checks: CompatibilityCheckItem[] = [];

  // 1. Ski + Binding Brake Width Check
  if (ski) {
    if (ski.includesBindings) {
      checks.push({
        id: 'integrated-binding',
        title: 'Комплектные крепления на лыже',
        status: 'pass',
        detail: `${ski.brand} ${ski.model} уже поставляется с интегрированными креплениями (DIN до ${
          ski.specs.included_binding_din || 12
        }). Покупать отдельные крепления не нужно.`,
      });
    } else if (binding) {
      const waist = ski.specs.waist_mm || 95;
      const brake = binding.specs.brake_width_mm || 100;
      const diff = brake - waist;

      if (diff < 0) {
        checks.push({
          id: 'brake-width',
          title: 'Ширина ски-стопа к талии лыжи',
          status: 'error',
          detail: `НЕСОВМЕСТИМО: Ски-стоп крепления ${binding.model} (${brake} мм) УЖЕ талии лыжи (${waist} мм на ${Math.abs(
            diff
          )} мм). Лапки ски-стопа не пройдут через кант! Нужен ски-стоп ${waist}–${waist + 15} мм.`,
        });
      } else if (diff <= 15) {
        checks.push({
          id: 'brake-width',
          title: 'Ширина ски-стопа к талии лыжи',
          status: 'pass',
          detail: `ИДЕАЛЬНО: Ски-стоп ${brake} мм на талию ${waist} мм (запас +${diff} мм укладывается в инженерный стандарт 0…+15 мм).`,
        });
      } else {
        checks.push({
          id: 'brake-width',
          title: 'Ширина ски-стопа к талии лыжи',
          status: 'warning',
          detail: `ВНИМАНИЕ: Ски-стоп ${brake} мм слишком широк для талии ${waist} мм (+${diff} мм > 15 мм). При сильной закантовке тормоза могут цеплять склон.`,
        });
      }
    }
  }

  // 2. Boot Sole Norm + Binding Norm Check
  if (boot && (binding || (ski && ski.includesBindings))) {
    const bootNorm = boot.specs.sole_norm || 'GripWalk (ISO 23223)';
    if (ski && ski.includesBindings) {
      if (bootNorm.includes('Touring') && !boot.specs.also_gripwalk_compatible) {
        checks.push({
          id: 'sole-norm',
          title: 'Стандарт подошвы ботинка и креплений',
          status: 'error',
          detail: `Ботинок ${boot.model} имеет туринговую подошву ${bootNorm}, которая не защелкивается в трассовые рельсовые крепления без стандарта MNC.`,
        });
      } else {
        checks.push({
          id: 'sole-norm',
          title: 'Стандарт подошвы ботинка и креплений',
          status: 'pass',
          detail: `Подошва ${bootNorm} полностью совместима с интегрированным креплением GW на лыже.`,
        });
      }
    } else if (binding) {
      const compatList = binding.specs.compatible_norms || ['GripWalk (ISO 23223)', 'Alpine (ISO 5355)'];
      const isCompatible =
        compatList.includes(bootNorm) ||
        (boot.specs.also_gripwalk_compatible && compatList.includes('GripWalk (ISO 23223)'));

      if (isCompatible) {
        checks.push({
          id: 'sole-norm',
          title: 'Стандарт подошвы (ISO) Ботинок ↔ Крепление',
          status: 'pass',
          detail: `СОВМЕСТИМО: Ботинок (${bootNorm}) корректно работает с головкой крепления ${binding.brand} ${binding.model} (${binding.specs.sole_norm}).`,
        });
      } else {
        checks.push({
          id: 'sole-norm',
          title: 'Стандарт подошвы (ISO) Ботинок ↔ Крепление',
          status: 'error',
          detail: `КОНФЛИКТ ПОДОШВЫ: Ботинок ${boot.model} имеет стандарт ${bootNorm}, но крепление ${binding.model} поддерживает только ${compatList.join(
            ', '
          )}. Выберите мультистандартное крепление (Marker ID / MN).`,
        });
      }
    }
  }

  // 3. DIN Range Check
  if (binding || (ski && ski.includesBindings)) {
    const maxDin = ski?.includesBindings ? ski.specs.included_binding_din || 12 : binding?.specs.din_max || 14;
    const minDin = ski?.includesBindings ? 3.5 : binding?.specs.din_min || 4;
    if (rec.recommendedDin >= minDin && rec.recommendedDin <= maxDin - 1.5) {
      checks.push({
        id: 'din-range',
        title: 'Рабочий диапазон усилия DIN',
        status: 'pass',
        detail: `Ваш расчётный DIN ${rec.recommendedDin} находится в оптимальной средней зоне пружины крепления (${minDin}–${maxDin} DIN).`,
      });
    } else if (rec.recommendedDin <= maxDin) {
      checks.push({
        id: 'din-range',
        title: 'Рабочий диапазон усилия DIN',
        status: 'warning',
        detail: `Ваш расчётный DIN ${rec.recommendedDin} близок к пределу пружины (${maxDin} DIN). Рекомендуется крепление с верхним порогом 14–16 DIN.`,
      });
    } else {
      checks.push({
        id: 'din-range',
        title: 'Рабочий диапазон усилия DIN',
        status: 'error',
        detail: `ОПАСНО: Ваш расчётный DIN ${rec.recommendedDin} превышает максимум крепления (${maxDin} DIN)!`,
      });
    }
  }

  // 4. Real Size Availability Check in Stores
  if (ski) {
    const matchingSizes = ski.availableSizesUnion.filter((s) => {
      const n = parseInt(s, 10);
      return !isNaN(n) && n >= rec.minSkiLengthCm && n <= rec.maxSkiLengthCm;
    });
    if (matchingSizes.length > 0) {
      checks.push({
        id: 'ski-size-stock',
        title: 'Наличие вашей ростовки в магазинах',
        status: 'pass',
        detail: `Под ваш рост (${rider.heightCm} см) рекомендуются лыжи ${rec.minSkiLengthCm}–${rec.maxSkiLengthCm} см. В наличии в магазинах есть ростовки: ${matchingSizes.join(
          ', '
        )} см.`,
      });
    } else {
      checks.push({
        id: 'ski-size-stock',
        title: 'Наличие вашей ростовки в магазинах',
        status: 'warning',
        detail: `Рекомендуемый диапазон ${rec.minSkiLengthCm}–${rec.maxSkiLengthCm} см, но сейчас у этой модели в наличии только: ${ski.availableSizesUnion.join(
          ', '
        )} см.`,
      });
    }
  }

  if (boot) {
    const hasBootSize = boot.availableSizesUnion.includes(rider.mondopoint);
    if (hasBootSize) {
      checks.push({
        id: 'boot-size-stock',
        title: `Наличие размера ботинка Mondopoint ${rider.mondopoint}`,
        status: 'pass',
        detail: `Размер ${rider.mondopoint} есть в наличии у ${
          boot.offers.filter((o) => o.availableSizes.includes(rider.mondopoint)).length
        } магазинов.`,
      });
    } else {
      checks.push({
        id: 'boot-size-stock',
        title: `Наличие размера ботинка Mondopoint ${rider.mondopoint}`,
        status: 'warning',
        detail: `Размера ${rider.mondopoint} нет в наличии для этой модели (доступны: ${boot.availableSizesUnion.join(
          ', '
        )}).`,
      });
    }
  }

  return checks;
}

export function formatMoney(amountRub: number, currency: CurrencyCode, fxRatesToRub: Record<CurrencyCode, number>): string {
  const rate = fxRatesToRub[currency] || 1;
  const converted = currency === 'RUB' ? amountRub : amountRub / rate;
  const rounded =
    currency === 'EUR' || currency === 'USD'
      ? Math.round(converted)
      : Math.round(converted / 10) * 10;

  const formatted = new Intl.NumberFormat('ru-RU').format(rounded);
  switch (currency) {
    case 'RUB':
      return `${formatted} ₽`;
    case 'KZT':
      return `${formatted} ₸`;
    case 'EUR':
      return `€${formatted}`;
    case 'USD':
      return `$${formatted}`;
  }
}

export function formatOriginalOfferPrice(amount: number, currency: CurrencyCode): string {
  const formatted = new Intl.NumberFormat('ru-RU').format(Math.round(amount));
  switch (currency) {
    case 'RUB':
      return `${formatted} ₽`;
    case 'KZT':
      return `${formatted} ₸`;
    case 'EUR':
      return `€${formatted}`;
    case 'USD':
      return `$${formatted}`;
  }
}
