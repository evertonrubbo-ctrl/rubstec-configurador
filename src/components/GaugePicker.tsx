'use client';
import React from 'react';

export const BITOLAS = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10];

function dotPx(mm2:number){
  const d = Math.sqrt((4*mm2)/Math.PI);
  const px = 8 + d*4;
  return Math.max(10, Math.min(28, px));
}

export default function GaugePicker({
  value, onChange,
}: { value:number; onChange:(v:number)=>void; }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Bitola (mm²)</div>
      <div className="flex flex-wrap gap-3 items-end">
        {BITOLAS.map(b=>{
          const sel = b === value;
          return (
            <button key={b} onClick={()=>onChange(b)}
              className={`flex flex-col items-center ${sel ? 'text-blue-700' : 'text-gray-500'}`}>
              <span className={`rounded-full border ${sel?'border-blue-600 ring-2 ring-blue-300':'border-gray-300'}`}
                    style={{ width: dotPx(b), height: dotPx(b), background:'#fefefe' }} />
              <span className="text-xs mt-1">{b}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
