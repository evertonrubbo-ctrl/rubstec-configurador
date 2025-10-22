// components/TerminalPicker.tsx
'use client';
import React from 'react';
import type { TerminalId } from './CablePreview';

export type TerminalOption = { id: TerminalId; label: string; img: string; };

export const TERMINALS: TerminalOption[] = [
  { id: 'olhal',  label: 'Olhal',     img: '/terminals/olhal.png' },
  { id: 'ilhos',  label: 'Ilhós',     img: '/terminals/ilhos.png' },
  { id: 'forquilha',  label: 'Forquilha', img: '/terminals/forquilha.png' },
  { id: 'pino',    label: 'Pino',      img: '/terminals/pino.png' },
  { id: 'compressao',    label: 'Compressão',      img: '/terminals/compressao.png' },
  { id: 'faston-femea',    label: 'Faston Fêmea',      img: '/terminals/faston-femea.png' },
  { id: 'faston-macho',    label: 'Faston Macho',      img: '/terminals/faston-macho.png' },
  { id: 'sem-terminal',    label: 'Sem Terminal',      img: '/terminals/sem-terminal.png' },
];

type Rule = {
  /** lista explícita de bitolas permitidas (se definir, vira whitelist) */
  allow?: number[];
  /** bitolas proibidas (blacklist) */
  deny?: number[];
  /** limites opcionais */
  min?: number;
  max?: number;
};

const TERMINAL_RULES: Record<TerminalId, Rule> = {
  olhal:       { deny: [10] },
  forquilha:   { deny: [10] },
  'faston-femea':   { deny: [10] },
  'faston-macho':   { deny: [10] },
  pino:        { deny: [10] },
  compressao:  {deny: [0.5, 0.75, 1, 1.5, 2.5, 4]},
  ilhos:       { },         // tudo permitido por padrão
  'sem-terminal': { },      // tudo permitido por padrão
};

function isAllowed(id: TerminalId, bitola: number) {
  const r = TERMINAL_RULES[id] || {};
  if (r.allow && !r.allow.includes(bitola)) return false;
  if (r.deny && r.deny.includes(bitola))   return false;
  if (r.min != null && bitola < r.min)     return false;
  if (r.max != null && bitola > r.max)     return false;
  return true;
}

// TerminalPicker.tsx
type Props = {
  value: TerminalId;
  onChange: (v: TerminalId) => void;
  title: string;
  bitola: number;                           
  renderBelow?: (id: TerminalId) => React.ReactNode;
};

export default function TerminalPicker({ value, onChange, title, bitola, renderBelow }: Props) {
  const visible = TERMINALS.filter(opt => isAllowed(opt.id, bitola));

  // se a seleção atual não é mais permitida, ajusta
  React.useEffect(() => {
    if (!isAllowed(value, bitola)) {
      const fallback = visible[0]?.id ?? 'sem-terminal';
      if (fallback !== value) onChange(fallback as TerminalId);
    }
  }, [bitola]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {visible.map((opt) => {
          const active = value === opt.id;

          // só gera o conteúdo extra quando ativo
          const below = active ? renderBelow?.(opt.id) : null;
          const expand = Boolean(below); // expande apenas se houver seletor de furo

          return (
            <div
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={[
                "relative cursor-pointer rounded border p-3 bg-white flex flex-col items-center",
                "transition-all duration-200",
                expand ? "h-54" : "h-40", // alto só quando tem seletor de furo
                active ? "ring-2 ring-blue-600 ring-offset-2" : "hover:bg-gray-50",
              ].join(" ")}
            >
              <img
                src={opt.img}
                alt={opt.label}
                className={(expand ? "h-16" : "h-20") + " object-contain pointer-events-none"}
              />
              <div className="mt-2 text-sm text-gray-700 text-center">{opt.label}</div>

              {/* conteúdo extra só quando existir (seletor de furo, etc.) */}
              {expand && <div className="mt-2 w-full">{below}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

