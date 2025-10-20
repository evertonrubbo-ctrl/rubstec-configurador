'use client';
import React from 'react';

//export type WireType = 'corfio-flex' | 'silicone' | 'pp' | 'blindado';
export type WireType = 'corfio-flex';

export const WIRES: {
  id: WireType;
  label: string;
  desc: string;
  img: string;
}[] = [
  {
    id: 'corfio-flex',
    label: 'Corfio Flexível',
    desc: 'Cabo flexível 750V • PVC • Classe 5',
    img: '/wires/corfio-flex.png',
  },
 /* {
    id: 'silicone',
    label: 'Silicone Alta Temp.',
    desc: 'Silicone 180 °C • Classe 5',
    img: '/wires/silicone.png',
  },
  {
    id: 'pp',
    label: 'PP (bi/tri)',
    desc: 'Cabo PP paralelado • Isol. PVC',
    img: '/wires/pp.png',
  },
  {
    id: 'blindado',
    label: 'Blindado Malha',
    desc: 'Sinal/controle • Blindagem em malha',
    img: '/wires/blindado.png',
  },*/
];

type Props = {
  title?: string;
  /** fio selecionado */
  value: WireType;
  /** metragem (numérico) */
  meters: number;
  /** troca de fio */
  onChange: (v: WireType) => void;
  /** troca de metragem (numérico) */
  onChangeMeters: (m: number) => void;
};

export default function WirePicker({
  title = 'Tipo de fio',
  value,
  meters,
  onChange,
  onChangeMeters,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {WIRES.map((w) => {
          const selected = value === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onChange(w.id)}
              className={`border rounded-xl p-4 flex flex-col items-center gap-2 transition
                          ${selected ? 'ring-2 ring-blue-600 border-blue-600' : 'hover:border-gray-400'}`}
            >
              {w.img ? (
                <img src={w.img} alt={w.label} className="h-28 sm:h-32 object-contain" />
              ) : (
                <div className="h-16 flex items-center justify-center text-gray-600">
                  {w.label}
                </div>
              )}

              <span className="text-sm font-medium text-center">{w.label}</span>
              <span className="text-[11px] text-gray-600 text-center leading-tight">
                {w.desc}
              </span>

              {/* campo de metragem só no card ativo */}
              {selected && (
                <div className="w-full pt-2">
                  <div className="text-[11px] text-gray-600 mb-1">Metragem (m)</div>
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    className="border rounded p-2 w-full max-w-[160px]"
                    value={meters}
                    onChange={(e) => {
                      const n = Math.max(0.1, parseFloat(e.target.value || '0'));
                      onChangeMeters(isFinite(n) ? n : 0.1);
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
