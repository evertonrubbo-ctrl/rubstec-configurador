'use client';
import React from 'react';

export type ColorOpt = { name: string; hex: string };
export const COLORS: ColorOpt[] = [
  { name:'Preto', hex:'#222222' },
  { name:'Vermelho', hex:'#E53935' },
  { name:'Azul', hex:'#1E88E5' },
  { name: 'Azul Escuro',  hex: '#0D47A1'},
  { name: 'Verde',        hex: '#00A859'},
  { name: 'Amarelo',      hex: '#FFD600'},
  { name: 'Laranja',      hex: '#FF9800'},
  { name: 'Lilás',        hex: '#9C27B0'},
  { name: 'Marrom',       hex: '#6D4C41'},
  { name:'Terra', hex:'#A0522D' },
  { name:'Cinza', hex:'#9E9E9E' },
  { name:'Branco', hex:'#F5F5F5' },
];

export default function ColorPicker({
  value, onChange,
}: { value: string; onChange: (hex: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Cor do Cabo</div>
      <div className="flex flex-wrap gap-3">
        {COLORS.map(c => {
          const sel = c.hex === value;
          return (
            <button key={c.hex} onClick={() => onChange(c.hex)}
              className={`relative w-9 h-9 rounded-full border
                         ${sel ? 'ring-2 ring-emerald-600 border-emerald-600' : 'border-gray-300'}`}
              title={c.name} style={{ background: c.hex }}>
              {sel && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px]">
                  {c.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
