'use client';
import React from 'react';
import { getIdentifierLabel } from '@/components/IdentifierPicker';

export type TerminalId = 'olhal' | 'ilhos' | 'forquilha' | 'pino' | 'compressao' | 'faston-femea' | 'faston-macho'| 'sem-terminal';
export type IdentifierType = 'none' | 'luva' | 'termorretratil' | 'clip' | 'etiqueta' | 'etiqueta-bandeira' | 'plaqueta' | 'plaqueta-com-abracadeira';

type Props = {
  color: string;
  gaugeMm2: number;
  lengthPx: number;
  termA: TerminalId;
  termB: TerminalId;
  // NOVO: identificadores por lado
  idTypeA?: IdentifierType;
  idTextA?: string;
  idTypeB?: IdentifierType;
  idTextB?: string;

  // NOVO: marca no cabo
  brand?: string; // default: 'Corfio'
};


// Cor do ilhós por bitola (exemplo – ajuste conforme seu padrão)
const ILHOS_COLORS: Record<number, string> = {
  0.5:  '#ffffffec', 
  0.75: '#898989', 
  1:    '#E53935', 
  1.5:  '#000000 ', 
  2.5:  '#0026ffff', 
  4:    '#898989', 
  6:    '#FFEB3B', 
  10:   '#E53935', 
};

const OLHAL_COLORS: Record<number, string> = {
  0.5:  '#E53935', 
  0.75: '#E53935', 
  1:    '#E53935', 
  1.5:  '#0026ffff', 
  2.5:  '#0026ffff', 
  4:    '#eeff00ff', 
  6:    '#eeff00ff', 
  10:   '#E53935', 
};


function gaugeHeightPx(mm2: number) {
  const d = Math.sqrt((4 * mm2) / Math.PI);
  const h = 10 + d * 6;
  return Math.max(24, Math.min(60, h));
}


const CablePreview: React.FC<Props> = ({
  color,
  gaugeMm2,
  lengthPx,
  termA,
  termB,
  idTypeA = 'none',
  idTextA = '',
  idTypeB = 'none',
  idTextB = '',
  brand = 'Corfio',
}) => {
  const h = gaugeHeightPx(gaugeMm2);
  const y = 75 - h / 2;
  const w = Math.max(260, lengthPx + 160);

  const imgA = `/terminals/${termA}.png`;
  const imgB = `/terminals/${termB}.png`;

  const idImgA = idTypeA && idTypeA !== 'none' ? `/identifiers/${idTypeA}.png` : null;
  const idImgB = idTypeB && idTypeB !== 'none' ? `/identifiers/${idTypeB}.png` : null;

  // centro dos terminais (para posicionar a "corzinha" do terminal)
  const aCx = 16 + 60 / 2; // (x=16,y=36,w=60,h=78) => (46,75)
  const aCy = 36 + 78 / 2;

  const olhalColor = OLHAL_COLORS[gaugeMm2] || '#2D2D2D';
  const ilhosColor = ILHOS_COLORS[gaugeMm2] || '#2D2D2D';

  // posições dos marcadores (A/B) — abaixo do cabo
  const markerY = y + h + 28;
  const markerAX = 80 + 40;
  const markerBX = 80 + lengthPx - 40;

  // textos de marca repetidos no cabo
  const brandStep = 130; // espaçamento entre repetições
  const brandItems = [];
  for (let x = 80 + 16; x < 80 + lengthPx - 16; x += brandStep) {
    brandItems.push(
      <text
        key={`brand-${x}`}
        x={x}
        y={y + h / 2 + (h >= 40 ? 4 : 2)}
        fill="#ffffff"
        fillOpacity={0.6}
        fontWeight={700}
        fontSize={Math.max(12, Math.floor(h * 0.45))}
        textAnchor="start"
        style={{
          letterSpacing: 1,
          paintOrder: 'stroke',
          // leve “relevo” para parecer impressão sobre o PVC
          stroke: '#000',
          strokeOpacity: 0.12,
          strokeWidth: 0.8,
        }}
      >
        {brand}
      </text>
    );
  }

  // util para desenhar o “quadradinho” de cor de terminal
  const ColorSquare = ({ x, y, fill }: { x: number; y: number; fill: string }) => (
    <rect x={x} y={y} width={30} height={30} fill={fill} stroke="white" strokeWidth={2} />
  );

    // util para desenhar um marcador (imagem + texto) num ponto (cx, markerY)
    const Marker = ({
      cx,
      type,
      text,
    }: {
      cx: number;
      type: IdentifierType;
      text?: string;
    }) => {
      if (!type || type === 'none') return null;

      const href = `/identifiers/${type}.png`;
      // Se o usuário não digitou nada, usa o label oficial daquele id
      const label = (text && text.trim() ? text : getIdentifierLabel(type))
        .toUpperCase()
        .slice(0, 24);

      return (
        <g transform={`translate(${cx}, ${markerY})`}>
          <image href={href} x={-32} y={-20} width={64} height={36} />
          {label && (
            <text
              x={0}
              y={28}
              textAnchor="middle"
              fontSize={12}
              fontFamily="Inter, system-ui, sans-serif"
              fill="#111827"
              fontWeight={600}
            >
              {label}
            </text>
          )}
        </g>
      );
    };

    return (
    <svg
      width={w}
      height={170}
      style={{ background: '#f5f6f8', borderRadius: 12, boxShadow: '0 1px 8px #0001' }}
    >
      {/* Terminal A (espelhado) */}
      <g>
        <image href={imgA} x="14" y="36" width="80" height="78" transform={`rotate(180 ${aCx} ${aCy})`} />
        {(termA === 'olhal' || termA === 'forquilha') && <ColorSquare x={aCx + 3} y={aCy - 15} fill={olhalColor} />}
        {termA === 'ilhos' && <ColorSquare x={aCx + 3} y={aCy - 15} fill={ilhosColor} />}
        {termA === 'pino' && <ColorSquare x={aCx + 3} y={aCy - 15} fill={olhalColor} />}
        {termA === 'faston-femea' && <ColorSquare x={aCx + 3} y={aCy - 15} fill={olhalColor} />}
        {termA === 'faston-macho' && <ColorSquare x={aCx + 3} y={aCy - 15} fill={olhalColor} />}
      </g>

      {/* gradiente de brilho */}
      <defs>
        <linearGradient id="shine" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="50%" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.20" />
        </linearGradient>

        {/* clip para conter a marca dentro do cabo */}
        <clipPath id="wireClip">
          <rect x={80} y={y} width={lengthPx} height={h} rx={h / 2} />
        </clipPath>
      </defs>

      {/* Cabo */}
      <rect x={80} y={y} width={lengthPx} height={h} rx={h / 2} fill={color} />
      {/* Marca "Corfio" repetida, recortada pelo cabo */}
      <g clipPath="url(#wireClip)">{brandItems}</g>
      {/* brilho */}
      <rect x={80} y={y} width={lengthPx} height={h} rx={h / 2} fill="url(#shine)" opacity={0.35} />

      {/* Terminal B */}
      <g transform={`translate(${80 + lengthPx + 8},0)`}>
        <image href={imgB} x="-10" y="36" width="80" height="78" />
        {(termB === 'olhal' || termB === 'forquilha') && <ColorSquare x={aCx - 56} y={aCy - 15} fill={olhalColor} />}
        {termB === 'ilhos' && <ColorSquare x={aCx - 56} y={aCy - 15} fill={ilhosColor} />}
        {termB === 'pino' && <ColorSquare x={aCx - 56} y={aCy - 15} fill={olhalColor} />}
        {termB === 'faston-femea' && <ColorSquare x={aCx - 56} y={aCy - 15} fill={olhalColor} />}
        {termB === 'faston-macho' && <ColorSquare x={aCx - 56} y={aCy - 15} fill={olhalColor} />}
      </g>

      {/* Marcadores por lado, abaixo do cabo */}
    <Marker cx={markerAX} type={idTypeA} text={idTextA} />
    <Marker cx={markerBX} type={idTypeB} text={idTextB} />

    </svg>
  );
};

export default CablePreview;
