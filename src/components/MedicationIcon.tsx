import React from 'react';

export type MedVisualKind = 'antibiotic' | 'nebulizer' | 'fever' | 'probiotic' | 'generic';

export function getMedicationMeta(name: string): {
  shortName: string;
  brandTag: string;
  kind: MedVisualKind;
} {
  const lower = name.toLowerCase();
  if (lower.includes('amoxicil')) {
    return { shortName: 'Amoxicillin', brandTag: 'Antibiotic · suspension', kind: 'antibiotic' };
  }
  if (lower.includes('pulmicort') || lower.includes('nebuliz')) {
    return { shortName: 'Pulmicort', brandTag: 'Nebulizer · vial', kind: 'nebulizer' };
  }
  if (lower.includes('motrin') || lower.includes('ibuprofen')) {
    return { shortName: "Children's Motrin", brandTag: 'Fever & pain relief', kind: 'fever' };
  }
  if (lower.includes('culturelle') || lower.includes('probiotic')) {
    return { shortName: 'Culturelle Baby', brandTag: 'Probiotic · drops', kind: 'probiotic' };
  }
  return { shortName: name.split('(')[0].trim(), brandTag: 'Active medication', kind: 'generic' };
}

export function getShortDosage(dosage: string): string {
  const lower = dosage.toLowerCase();
  if (lower.includes('vial')) return '1 vial + 2 ml';
  return dosage;
}

export const MedicationIcon: React.FC<{ kind: MedVisualKind; size?: 'lg' | 'sm' }> = ({
  kind,
  size = 'lg',
}) => {
  const boxClass =
    size === 'lg'
      ? 'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border'
      : 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border';
  const svgClass = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';

  if (kind === 'antibiotic') {
    return (
      <div
        className={`${boxClass} bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={svgClass}>
          <path d="M9 3h6v3H9z" strokeLinejoin="round" />
          <path d="M8 6h8l1.5 3.5V19a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V9.5L8 6z" strokeLinejoin="round" />
          <path d="M10 13h4M12 11v4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (kind === 'nebulizer') {
    return (
      <div
        className={`${boxClass} bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={svgClass}>
          <path d="M12 3v4" strokeLinecap="round" />
          <path d="M8.5 7h7l1 11.5a2 2 0 0 1-2 2.5h-5a2 2 0 0 1-2-2.5L8.5 7z" strokeLinejoin="round" />
          <path d="M5 10.5c-.8.8-.8 2.2 0 3M19 10.5c.8.8.8 2.2 0 3" strokeLinecap="round" />
          <path d="M10 14h4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (kind === 'fever') {
    return (
      <div
        className={`${boxClass} bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={svgClass}>
          <path d="M12 3s6 6.8 6 11a6 6 0 1 1-12 0c0-4.2 6-11 6-11z" strokeLinejoin="round" />
          <path d="M12 12v4M10 14h4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (kind === 'probiotic') {
    return (
      <div
        className={`${boxClass} bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={svgClass}>
          <path d="M14.5 4.5a2.12 2.12 0 0 1 3 3L16 9l1 1-2 2-3-3 2-2 1 1 1.5-1.5z" strokeLinejoin="round" />
          <path d="M12 11l-6.5 6.5L5 20l2.5-.5L14 13" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${boxClass} bg-stone-500/15 border-stone-500/30 text-stone-600 dark:text-stone-300`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={svgClass}>
        <rect x="6" y="4" width="12" height="16" rx="3" />
        <path d="M10 12h4M12 10v4" strokeLinecap="round" />
      </svg>
    </div>
  );
};
