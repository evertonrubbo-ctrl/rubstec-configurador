'use client';
import React from 'react';

export function OptionCard({
  selected, onClick, title, subtitle, img,
}: {
  selected?: boolean; onClick: () => void; title: string; subtitle?: string; img?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full rounded-2xl p-4 border text-left
                  ${selected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'}
                  hover:border-blue-400 transition`}>
      {img && <img src={img} alt="" className="h-28 w-full object-cover rounded-xl mb-3" />}
      <div className="font-semibold">{title}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </button>
  );
}
