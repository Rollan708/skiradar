import React from 'react';
import type { GoldenProduct } from '../types';

const BRAND_COLORS: Record<string, { primary: string; secondary: string }> = {
  Atomic: { primary: '#FF3B30', secondary: '#00E5FF' },
  Salomon: { primary: '#00E5FF', secondary: '#7C3AED' },
  K2: { primary: '#10B981', secondary: '#F59E0B' },
  Head: { primary: '#FACC15', secondary: '#06B6D4' },
  Elan: { primary: '#10B981', secondary: '#38BDF8' },
  'Völkl': { primary: '#F59E0B', secondary: '#EF4444' },
  Rossignol: { primary: '#EC4899', secondary: '#00E5FF' },
  Tecnica: { primary: '#FF5500', secondary: '#FBBF24' },
  Marker: { primary: '#00E5FF', secondary: '#F43F5E' },
  Tyrolia: { primary: '#38BDF8', secondary: '#FB7185' },
  Oakley: { primary: '#FF5500', secondary: '#A855F7' },
  POC: { primary: '#00E5FF', secondary: '#34D399' },
};

export const SkiGraphicSvg: React.FC<{ product: GoldenProduct; compact?: boolean }> = ({
  product,
  compact = false,
}) => {
  const palette = BRAND_COLORS[product.brand] || { primary: '#00E5FF', secondary: '#3B82F6' };
  const gradId = `grad-${product.id}`;

  if (product.category === 'skis') {
    const tip = product.specs.tip_mm || 132;
    const waist = product.specs.waist_mm || 98;
    const tail = product.specs.tail_mm || 120;

    // Scale widths into SVG vertical space (center Y = 36)
    const tipHalf = Math.min(20, Math.max(10, (tip - 60) * 0.22));
    const waistHalf = Math.min(16, Math.max(6, (waist - 60) * 0.2));
    const tailHalf = Math.min(18, Math.max(9, (tail - 60) * 0.21));

    return (
      <svg
        viewBox="0 0 320 76"
        className={`w-full ${compact ? 'h-14' : 'h-20'} select-none`}
        aria-label={`${product.brand} ${product.model} geometry`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0F172A" stopOpacity="0.95" />
            <stop offset="100%" stopColor={palette.secondary} stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Telemetry grid lines */}
        <line x1="25" y1="8" x2="25" y2="68" stroke="#1E293B" strokeDasharray="2 2" />
        <line x1="160" y1="8" x2="160" y2="68" stroke="#00E5FF" strokeOpacity="0.35" strokeDasharray="2 2" />
        <line x1="292" y1="8" x2="292" y2="68" stroke="#1E293B" strokeDasharray="2 2" />

        {/* Ski silhouette with realistic sidecut curve */}
        <path
          d={`
            M 16 38
            Q 20 ${38 - tipHalf}, 42 ${38 - tipHalf}
            Q 160 ${38 - waistHalf}, 276 ${38 - tailHalf}
            Q 304 ${38 - tailHalf * 0.65}, 306 38
            Q 304 ${38 + tailHalf * 0.65}, 276 ${38 + tailHalf}
            Q 160 ${38 + waistHalf}, 42 ${38 + tipHalf}
            Q 20 ${38 + tipHalf}, 16 38
            Z
          `}
          fill={`url(#${gradId})`}
          stroke={palette.primary}
          strokeWidth="1.5"
        />

        {/* Mounting point & core graphic */}
        <rect
          x="136"
          y={38 - waistHalf * 0.65}
          width="48"
          height={waistHalf * 1.3}
          rx="3"
          fill="#070B14"
          stroke={product.includesBindings ? '#10B981' : '#334155'}
          strokeWidth="1.2"
        />
        <circle cx="160" cy="38" r="2.5" fill="#00E5FF" />

        {/* Telemetry labels */}
        <text x="26" y="13" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          {tip}мм
        </text>
        <text
          x="160"
          y="13"
          textAnchor="middle"
          fill="#00E5FF"
          fontSize="9.5"
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
        >
          ТАЛИЯ {waist}мм
        </text>
        <text
          x="292"
          y="13"
          textAnchor="end"
          fill="#94A3B8"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
        >
          {tail}мм
        </text>
        <text
          x="160"
          y="71"
          textAnchor="middle"
          fill="#64748B"
          fontSize="8.5"
          fontFamily="JetBrains Mono, monospace"
        >
          R {product.specs.radius_m}m • {product.specs.weight_g}г • {product.season}
        </text>
      </svg>
    );
  }

  if (product.category === 'boots') {
    return (
      <svg viewBox="0 0 320 76" className={`w-full ${compact ? 'h-14' : 'h-20'} select-none`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="0.85" />
            <stop offset="100%" stopColor={palette.secondary} stopOpacity="0.85" />
          </linearGradient>
        </defs>
        {/* Boot technical silhouette */}
        <path
          d="M 118 12 L 154 14 L 150 44 L 195 54 Q 204 56 204 63 L 108 63 L 110 42 Z"
          fill={`url(#${gradId})`}
          stroke={palette.primary}
          strokeWidth="1.5"
        />
        {/* GripWalk Sole tread */}
        <rect x="108" y="61" width="96" height="5" rx="2" fill="#00E5FF" opacity="0.8" />
        {/* Buckles */}
        <line x1="125" y1="22" x2="148" y2="24" stroke="#F8FAFC" strokeWidth="2" />
        <line x1="122" y1="33" x2="146" y2="35" stroke="#F8FAFC" strokeWidth="2" />
        <line x1="145" y1="48" x2="168" y2="52" stroke="#F8FAFC" strokeWidth="2" />

        <text x="22" y="34" fill="#00E5FF" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          FLEX {product.specs.flex_index}
        </text>
        <text x="22" y="49" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          КОЛОДКА {product.specs.last_mm}мм
        </text>
        <text x="298" y="38" textAnchor="end" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono, monospace">
          {product.specs.sole_norm?.split(' ')[0]}
        </text>
        <text x="298" y="52" textAnchor="end" fill="#64748B" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
          {product.specs.weight_g} г / бот.
        </text>
      </svg>
    );
  }

  if (product.category === 'bindings') {
    return (
      <svg viewBox="0 0 320 76" className={`w-full ${compact ? 'h-14' : 'h-20'} select-none`}>
        <rect x="40" y="36" width="240" height="6" rx="3" fill="#1E293B" />
        {/* Toe piece */}
        <path d="M 82 36 L 98 20 L 122 24 L 118 38 Z" fill={palette.primary} />
        {/* Heel piece & brake */}
        <path d="M 195 36 L 205 16 L 232 18 L 224 38 Z" fill={palette.secondary} />
        <path d="M 188 38 L 172 60" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" />
        <text
          x="160"
          y="22"
          textAnchor="middle"
          fill="#00E5FF"
          fontSize="10"
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
        >
          DIN {product.specs.din_min}–{product.specs.din_max} • СКИ-СТОП {product.specs.brake_width_mm}мм
        </text>
        <text
          x="160"
          y="67"
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="8.5"
          fontFamily="JetBrains Mono, monospace"
        >
          {product.specs.sole_norm} • {product.specs.weight_g} г
        </text>
      </svg>
    );
  }

  // Helmets & Goggles
  return (
    <svg viewBox="0 0 320 76" className={`w-full ${compact ? 'h-14' : 'h-20'} select-none`}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF5500" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
      </defs>
      <path
        d="M 96 22 Q 160 12 224 22 Q 234 42 214 54 Q 182 58 160 44 Q 138 58 106 54 Q 86 42 96 22 Z"
        fill={`url(#${gradId})`}
        opacity="0.88"
        stroke="#F8FAFC"
        strokeWidth="1.4"
      />
      <text
        x="160"
        y="70"
        textAnchor="middle"
        fill="#94A3B8"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
      >
        {product.specs.lens_type || (product.specs.mips ? 'MIPS + RECCO + twICEme NFC' : 'Alpine Protection')}
      </text>
    </svg>
  );
};
