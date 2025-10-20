'use client';
import React, { useEffect, useMemo } from 'react';

export type IdentifierType =
  | 'none' | 'luva' | 'termorretratil' | 'clip'
  | 'etiqueta' | 'etiqueta-bandeira'
  | 'plaqueta' | 'plaqueta-com-abracadeira';

export type MarkerColor = 'branco' | 'amarelo' | 'cinza' | 'verde' | 'transparente';

export const MARKER_COLORS: { id: MarkerColor; label: string; hex: string }[] = [
  { id: 'branco',       label: 'Branco',       hex: '#F5F5F5' },
  { id: 'amarelo',      label: 'Amarelo',      hex: '#FFEB3B' },
  { id: 'cinza',        label: 'Cinza',        hex: '#BDBDBD' },
  { id: 'verde',        label: 'Verde',        hex: '#105f00ff' },
  { id: 'transparente', label: 'Transparente', hex: '#FFFFFF' },
];

export const AVAILABLE_COLORS_BY_ID: Partial<Record<IdentifierType, MarkerColor[]>> = {
  none: [],
  luva: ['branco', 'amarelo'],
  clip: ['branco', 'amarelo'],
  etiqueta: ['branco', 'amarelo', 'cinza', 'verde'],
  'etiqueta-bandeira': ['branco', 'amarelo'],
  termorretratil: ['branco','amarelo'],
  plaqueta: ['branco', 'amarelo'],
  'plaqueta-com-abracadeira': ['branco', 'amarelo'],
};

export const IDENTIFIERS: { id: IdentifierType; label: string; img?: string }[] = [
  { id: 'none',                     label: 'Sem identificador' },
  { id: 'luva',                     label: 'Luva',                              img: '/identifiers/luva.png' },
  { id: 'clip',                     label: 'Clip',                              img: '/identifiers/clip.png' },
  { id: 'etiqueta',                 label: 'Etiqueta',                          img: '/identifiers/etiqueta.png' },
  { id: 'etiqueta-bandeira',        label: 'Etiqueta Bandeira',                 img: '/identifiers/etiqueta-bandeira.png' },
  { id: 'termorretratil',           label: 'Termorretrátil',                    img: '/identifiers/termorretratil.png' },
  { id: 'plaqueta',                 label: 'Plaqueta',                          img: '/identifiers/plaqueta.png' },
  { id: 'plaqueta-com-abracadeira', label: 'Plaqueta Com Abracadeira',          img: '/identifiers/plaqueta-com-abracadeira.png' },
];

export const ID_LABEL_BY_ID: Record<IdentifierType, string> =
  IDENTIFIERS.reduce((acc, it) => { acc[it.id] = it.label; return acc; }, {} as Record<IdentifierType, string>);

export function getIdentifierLabel(id: IdentifierType): string {
  return ID_LABEL_BY_ID[id] ?? '';
}

type Props = {
  title?: string;
  value: IdentifierType;
  onChange: (v: IdentifierType) => void;
  renderBelow?: (id: IdentifierType) => React.ReactNode;
  allowed?: IdentifierType[];

  /* cor */
  selectedColor?: MarkerColor;
  onColorChange?: (c: MarkerColor) => void;
  colorAllowed?: MarkerColor[];
  showColorPicker?: boolean;

  /* NOVO: regra simples por bitola */
  bitolaMm2?: number; // << quando !== 2.5 | 4 | 6 o "Clip" é ocultado
};

export default function IdentifierPicker({
  title = 'Identificador',
  value,
  onChange,
  renderBelow,
  allowed,
  selectedColor,
  onColorChange,
  colorAllowed,
  showColorPicker,
  bitolaMm2,
}: Props) {
  const items = useMemo(() => {
    let list = allowed ? IDENTIFIERS.filter(i => allowed.includes(i.id)) : IDENTIFIERS;

    /* Mostrar "Clip" só para 2.5, 4 ou 6 mm²
    if (typeof bitolaMm2 === 'number') {
      const allowClip = [2.5, 4, 6].includes(bitolaMm2);
      if (!allowClip) list = list.filter(i => i.id !== 'clip');
    }*/

    return list;
  }, [allowed, bitolaMm2]);

  useEffect(() => {
    if (!items.find(i => i.id === value)) {
      const first = items[0]?.id;
      if (first) onChange(first);
    }
  }, [items, value, onChange]);

  const defaultByType = AVAILABLE_COLORS_BY_ID[value] ?? MARKER_COLORS.map(c => c.id);
  const colorIds = (colorAllowed ?? defaultByType);

  const shouldShowColor =
    (showColorPicker ?? Boolean(onColorChange)) &&
    value !== 'none' &&
    colorIds.length > 0;

    // sempre que o tipo mudar, garante uma cor válida selecionada
  React.useEffect(() => {
    if (!onColorChange) return;

    const allowedByType = AVAILABLE_COLORS_BY_ID[value] ?? [];
    const allowed = (colorAllowed ?? allowedByType) as MarkerColor[];

    if (allowed.length === 0) return;

    // se não há cor selecionada OU a cor atual não é permitida para este tipo,
    // seleciona a primeira cor válida
    if (!selectedColor || !allowed.includes(selectedColor)) {
      onColorChange(allowed[0]);
    }
  }, [value, selectedColor, onColorChange, colorAllowed]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{title}</div>

      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {items.map(it => {
          const selected = value === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange(it.id)}
              className={`border rounded-lg p-4 flex flex-col items-center justify-between
                          h-full min-h-[150px] transition bg-white
                          ${selected ? 'ring-2 ring-blue-600 border-blue-600' : 'hover:border-gray-400'}`}
            >
              <div className="flex-1 flex items-center">
                {it.img ? (
                  <img src={it.img} alt={it.label} className="h-16 sm:h-30 max-w-full object-contain mx-auto" />
                ) : (
                  <div className="h-16 sm:h-20 flex items-center text-sm text-gray-600">{it.label}</div>
                )}
              </div>
              <span className="text-sm text-center leading-tight mt-2 break-words">{it.label}</span>
            </button>
          );
        })}
      </div>

      {shouldShowColor && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Cor do marcador</div>
          <div className="flex flex-wrap gap-2">
            {colorIds.map(id => {
              const meta = MARKER_COLORS.find(c => c.id === id)!;
              const isSel = selectedColor === id;
              const checker =
                id === 'transparente'
                  ? 'bg-[linear-gradient(45deg,#eee_25%,transparent_25%,transparent_50%,#eee_50%,#eee_75%,transparent_75%,transparent)] bg-[length:10px_10px]'
                  : '';

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onColorChange?.(id)}
                  className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition
                              ${isSel ? 'ring-2 ring-blue-600 border-blue-600' : 'hover:border-gray-400'}`}
                >
                  <span
                    className={`inline-block w-6 h-6 rounded ${checker}`}
                    style={id !== 'transparente' ? { backgroundColor: meta.hex } : {}}
                    aria-hidden
                  />
                  <span className="text-sm">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {renderBelow?.(value)}
    </div>
  );
}
