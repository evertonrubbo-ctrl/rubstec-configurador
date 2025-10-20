'use client';
import React, { useMemo, useState, useEffect } from 'react';
import CablePreview, { TerminalId } from '@/components/CablePreview';
import TerminalPicker from '@/components/TerminalPicker';
import ColorPicker from '@/components/ColorPicker';
import { COLORS } from '@/components/ColorPicker';
import GaugePicker from '@/components/GaugePicker';
import IdentifierPicker, { MarkerColor,IdentifierType, ID_LABEL_BY_ID } from '@/components/IdentifierPicker';
import WirePicker, { WireType } from '@/components/WirePicker';
import FinalizarOrcamento from '@/components/FinalizarOrcamento';

/** ==== PREÇOS / CÁLCULOS ==== */
// preços de exemplo por metro 
const precosMetro: Record<number, number> = {
  0.5: 0.80,
  0.75: 1.00,
  1: 1.02,
  1.5: 1.76,
  2.5: 2.56,
  4: 3.52,
  6: 6.00,
  10: 10.99,
};

const PRECO_TERM: Partial<Record<TerminalId, Partial<Record<number, number>>>> = {
    olhal: {
      0.5: 0.17, 0.75: 0.17, 1: 0.17, 1.5: 0.21,
      2.5: 0.21, 4: 0.36, 6: 0.36
    },
    ilhos: {
      0.5: 0.04, 0.75: 0.05, 1: 0.05, 1.5: 0.06,
      2.5: 0.07, 4: 0.12, 6: 0.16, 10: 0.19
    },
    forquilha: {
      0.5: 0.16, 0.75: 0.16, 1: 0.16, 1.5: 0.20,
      2.5: 0.20, 4: 0.36, 6: 0.36
    },
    compressao: {
      6: 0.80, 10: 0.92
    },
    'faston-femea': {
      0.5: 0.19, 0.75: 0.19, 1: 0.19, 1.5: 0.22,
      2.5: 0.22, 4: 0.23, 6: 0.23
    },
    'faston-macho': {
      0.5: 0.19, 0.75: 0.19, 1: 0.19, 1.5: 0.22,
      2.5: 0.22, 4: 0.23, 6: 0.23
    },
    pino: {
      0.5: 0.13, 0.75: 0.13, 1: 0.13, 1.5: 0.20,
      2.5: 0.20, 4: 0.23, 6: 0.23
    },
    'sem-terminal':    {}, 
  };

const precoTerminal = (tipo?: TerminalId, bitola?: number): number =>
  (tipo && bitola != null ? (PRECO_TERM[tipo]?.[bitola] ?? 0) : 0);

const PRECO_IDENT: Partial<Record<IdentifierType, Partial<Record<number, number>>>> = {
  none: {},
  luva: {
    0.5: 0.27, 0.75: 0.28, 1: 0.28, 1.5: 0.28, 2.5: 0.30, 4: 0.30, 6: 0.30, 10: 0.36,
  },
  termorretratil: {
    0.5: 0.21, 0.75: 0.21, 1: 0.21, 1.5: 0.22, 2.5: 0.23, 4: 0.23, 6: 0.25, 10: 0.28,
  },
  clip: {
    0.5: 1.14, 0.75: 1.14, 1: 1.17, 1.5: 1.17, 2.5: 1.38, 4: 1.60, 6: 1.68, 10: 1.82,
  },
  etiqueta: {
    0.5: 0.34, 0.75: 0.34, 1: 0.34, 1.5: 0.45, 2.5: 0.45, 4: 0.52, 6: 0.72, 10: 0.72,
  },
  'etiqueta-bandeira': {
    0.5: 0.58, 0.75: 0.58, 1: 0.58, 1.5: 0.58, 2.5: 0.58, 4: 0.58, 6: 0.65, 10: 0.65,
  },
  plaqueta: {
    0.5: 0.23, 0.75: 0.23, 1: 0.23, 1.5: 0.23, 2.5: 0.28, 4: 0.35, 6: 0.70, 10: 0.77,
  },
  'plaqueta-com-abracadeira': {
    0.5: 0.93, 0.75: 0.93, 1: 0.93, 1.5: 0.93, 2.5: 0.93, 4: 0.93, 6: 0.93, 10: 0.93,
  },
};

   // ===== FORMACAO DE PRECO =====
  const precoIdent = (tipo?: IdentifierType, bitola?: number): number =>
    (tipo && bitola != null ? (PRECO_IDENT[tipo]?.[bitola] ?? 0) : 0);

  // ===== CONFIGURÁVEIS =====
  const HORA_MO = 120; // R$/hora da mão de obra (preço de venda)

  // tempos (segundos)
  const T = {
    cortar: 6,
    decapar: 8,      // por extremidade
    crimpar: 10,     // por extremidade
    ident: 16,       // imprimir + aplicar, por lado
    qc: 4,
    porMetroExtra: 3 // por metro acima de 1 m
  };

  // ===== HELPERS =====
  const ceil2 = (v: number) => Math.ceil(v * 100) / 100;
  const isNone = (v?: string | null) => !v || v === 'none';

  // ===== CÁLCULO DE MÃO DE OBRA POR PEÇA =====
  function calcMaoObraPorPeca(params: {
    metragem: number;
    termA?: string; // TerminalId
    termB?: string; // TerminalId
    identA?: string; // IdentifierType
    identB?: string; // IdentifierType
  }): number {
    const { metragem, termA, termB, identA, identB } = params;

    let seg = 0;
    seg += T.cortar + T.qc;

    // comprimento: considera apenas o que exceder 1 m
    if (metragem && metragem > 1) {
      seg += (metragem - 1) * T.porMetroExtra;
    }

    // lado A
    if (!isNone(termA)) seg += T.decapar + T.crimpar;
    if (!isNone(identA)) seg += T.ident;

    // lado B
    if (!isNone(termB)) seg += T.decapar + T.crimpar;
    if (!isNone(identB)) seg += T.ident;

    const valorMO = (seg / 3600) * HORA_MO;
    return ceil2(valorMO); // sempre arredonda pra cima com 2 casas
  }

  // ===== SEU CÁLCULO FINAL (MATERIAIS + MÃO DE OBRA) =====
  const calcUnitPrice = (
    bitola: number,
    metragem: number,
    termA?: TerminalId,
    termB?: TerminalId,
    identA?: IdentifierType,
    identB?: IdentifierType,
    maoObra: number = NaN // se vier NaN/undefined, calculamos automaticamente
  ) => {
    const pm = precosMetro[bitola] ?? 8.9;

    const materiais =
      (pm * metragem) +
      precoTerminal(termA, bitola) +
      precoTerminal(termB, bitola) +
      precoIdent(identA, bitola) +
      precoIdent(identB, bitola);

    // calcula MO se não for passada
    const mo =
      Number.isFinite(maoObra)
        ? maoObra
        : calcMaoObraPorPeca({ metragem, termA: termA as any, termB: termB as any, identA: identA as any, identB: identB as any });

    const total = materiais + mo;
    //const total = materiais;
    return Number(total.toFixed(2));
  };


//nome da cor do fio
const COR_MAP = new Map(COLORS.map(c => [c.hex.toLowerCase(), c.name]));

function nomeDaCor(hex?: string): string {
  const key = (hex || '').trim().toLowerCase();
  if (!key) return '—';
  return COR_MAP.get(key) || key;  // se não achar, mostra o próprio hex
}

/** ==== CAMPOS CONDICIONAIS (FURO) ==== */
const NEEDS_HOLE = new Set<TerminalId>(['olhal', 'forquilha','compressao']);

//cor do identificador

const COLOR_LABEL: Record<MarkerColor, string> = {
  branco: 'Branco',
  amarelo: 'Amarelo',
  cinza: 'Cinza',
  verde: 'Verde',
  transparente: 'Transparente',
};

function labelWithColor(type: IdentifierType, color?: MarkerColor | null) {
  if (type === 'none') return '—';
  const base = ID_LABEL_BY_ID[type] ?? '';
  return color ? `${base} - ${COLOR_LABEL[color] ?? color}` : base;
}


// Mapa: bitola (mm²) -> opções válidas de furo (mm).
const HOLE_BY_GAUGE: Record<number, number[]> = {
  0.5:  [3, 4, 5, 6, 8],
  0.75: [3, 4, 5, 6, 8],
  1:    [3, 4, 5, 6, 8],
  1.5:  [3, 4, 5, 6, 8],
  2.5:  [3, 4, 5, 6, 8, 10],
  4:    [4, 5, 6, 8 ,10],
  6:    [4, 5, 6, 8 ,10],
  10:   [5, 6, 8],
};

const HOLE_BY_GAUGE_FORQUILHA: Record<number, number[]> = {
  0.5:  [3, 4, 5],
  0.75: [3, 4, 5],
  1:    [3, 4, 5],
  1.5:  [3, 4, 5],
  2.5:  [3, 4, 5],
  4:    [3, 4, 5, 6],
  6:    [3, 4, 5, 6],
  10:   [6, 8],
};

const HOLE_BY_GAUGE_COMPRESSAO: Record<number, number[]> = {
  6:    [5],
  10:   [6, 8],
};

const DEFAULT_HOLES = [4, 5, 6];

function getHoleOptions(gaugeMm2: number, terminal: TerminalId): number[] {
  if (!NEEDS_HOLE.has(terminal)) return [];
  if (terminal === 'forquilha') return HOLE_BY_GAUGE_FORQUILHA[gaugeMm2] ?? DEFAULT_HOLES;
  if (terminal === 'compressao') return HOLE_BY_GAUGE_COMPRESSAO[gaugeMm2] ?? DEFAULT_HOLES;
  return HOLE_BY_GAUGE[gaugeMm2] ?? DEFAULT_HOLES;
}

/** ==== ORÇAMENTO ==== */
type QuoteItem = {
  id: string;
  bitola: number;
  cor: string;
  metragem: number;
  termA: TerminalId;
  termB: TerminalId;
  termAHole?: number | null;
  termBHole?: number | null;
  qty: number;
  unitPrice: number;
  subtotal: number;

  //  NOVOS CAMPOS
  identifierTypeA?: IdentifierType | 'none';
  identifierTextA?: string | null;
  markerColorA?: MarkerColor | null;
  identifierTypeB?: IdentifierType | 'none';
  identifierTextB?: string | null;
  markerColorB?: MarkerColor | null;
};

export default function ConfiguratorPage() {
  const [wireType, setWireType] = useState<WireType>('corfio-flex');
  const [metragem, setMetragem] = useState<number>(0.1);
  const [step, setStep] = useState<number>(1);

  const [cor, setCor] = useState<string>('#E53935');

  const [termA, setTermA] = useState<TerminalId>('olhal');
  const [termB, setTermB] = useState<TerminalId>('olhal');

  const [termAHole, setTermAHole] = useState<number | null>(null);
  const [termBHole, setTermBHole] = useState<number | null>(null);

  const [qty, setQty] = useState<number>(1);
  const [items, setItems] = useState<QuoteItem[]>([]);

  // identificadores
  const [idTypeA, setIdTypeA] = useState<IdentifierType>('none');
  const [idTextA, setIdTextA] = useState('');
  const [idTypeB, setIdTypeB] = useState<IdentifierType>('none');
  const [idTextB, setIdTextB] = useState('');
  const [colorA, setColorA] = useState<MarkerColor>('branco');
  const [colorB, setColorB] = useState<MarkerColor>('branco');
  const [bitola, setBitola]   = useState<number>(1.5);
  const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  const lengthPx = useMemo(() => 220 + Math.min(640, metragem * 360), [metragem]);
  const unitPrice = useMemo(
    () => calcUnitPrice(bitola, metragem, termA, termB, idTypeA as IdentifierType, idTypeB as IdentifierType),
    [bitola, metragem, termA, termB, idTypeA, idTypeB]
  );

  // valida furo A
  useEffect(() => {
    if (!NEEDS_HOLE.has(termA)) { setTermAHole(null); return; }
    const allowed = getHoleOptions(bitola, termA);
    if (allowed.length === 0) { setTermAHole(null); return; }
    if (termAHole == null || !allowed.includes(termAHole)) setTermAHole(allowed[0]);
  }, [termA, bitola]); // eslint-disable-line

  // valida furo B
  useEffect(() => {
    if (!NEEDS_HOLE.has(termB)) { setTermBHole(null); return; }
    const allowed = getHoleOptions(bitola, termB);
    if (allowed.length === 0) { setTermBHole(null); return; }
    if (termBHole == null || !allowed.includes(termBHole)) setTermBHole(allowed[0]);
  }, [termB, bitola]); // eslint-disable-line

  const isIdAOk = idTypeA === 'none' || idTextA.trim().length > 0;
  const isIdBOk = idTypeB === 'none' || idTextB.trim().length > 0;

  const canNext =
    (step === 1 && metragem >= 0.1) ||
    (step === 2 && !!bitola) ||
    (step === 3 && !!cor) ||
    (step === 4 && !!termA && (!NEEDS_HOLE.has(termA) || (termAHole !== null && getHoleOptions(bitola, termA).includes(termAHole)))) ||
    (step === 5 && !!termB && (!NEEDS_HOLE.has(termB) || (termBHole !== null && getHoleOptions(bitola, termB).includes(termBHole)))) ||
    (step === 6 && isIdAOk && isIdBOk) ||
    (step === 7 && qty >= 1);

  function next() { if (step < 7 && canNext) setStep(step + 1); }
  function back() { if (step > 1) setStep(step - 1); }

  
  function addToQuote() {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      bitola, cor, metragem, termA, termB,
      termAHole, termBHole,
      qty,
      unitPrice,
      subtotal: Number((unitPrice * qty).toFixed(2)),

      // ★ salva identificadores e textos
      identifierTypeA: idTypeA,
      identifierTextA: idTypeA === 'none' ? null : (idTextA.trim() || null),
      identifierTypeB: idTypeB,
      identifierTextB: idTypeB === 'none' ? null : (idTextB.trim() || null),
      markerColorA: idTypeA === 'none' ? null : colorA,
      markerColorB: idTypeB === 'none' ? null : colorB,
    };
    setItems(prev => [...prev, newItem]);
    setStep(1); setQty(1);
  }

  const total = items.reduce((s, it) => s + it.subtotal, 0);

  // helper p/ mostrar rótulo bonito (ou "—")
  const labelOrDash = (id?: IdentifierType | 'none') =>
    !id || id === 'none' ? '—' : (ID_LABEL_BY_ID[id] ?? String(id));

  // defina perto do componente (fora do return)
  const STEP_HELP: Record<number, React.ReactNode> = {
    1: <>Passo 1: Escolha o <b>TIPO</b> e defina o <b>COMPRIMENTO</b> do fio para iniciar.</>,
    2: <>Passo 2: Escolha a <b>BITOLA</b> do fio.</>,
    3: <>Passo 3: Escolha a <b>COR</b> do fio.</>,
    4: <>Passo 4: Selecione o <b>TERMINAL LADO A</b> (ex.: olhal/ilhós) e <b>furo</b> se houver.</>,
    5: <>Passo 5: Selecione o <b>TERMINAL LADO B</b> (ex.: olhal/ilhós) e <b>furo</b> se houver.</>,
    6: <>Passo 6: Escolha a <b>IDENTIFICAÇÃO</b> (luva, termorretrátil, clip), <b>COR</b> e digite a <b>LEGENDA</b>.</>,
    7: <>Defina a <b>quantidade</b> e adicione no orçamento.</>,
    8: <>Revise e adicione ao orçamento.</>,
  };


  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Configurador de Cabos C/Terminais</h1>
       
      <CablePreview
        color={cor}
        gaugeMm2={bitola}
        lengthPx={lengthPx}
        termA={termA}
        termB={termB}
        idTypeA={idTypeA}
        idTextA={idTextA}
        idTypeB={idTypeB}
        idTextB={idTextB}
      />

    <div className="space-y-2">
      <div className="flex items-center justify-between bg-white border rounded p-3">
        <div>Passo <b>{step}</b> de 7</div>
        <div className="space-x-2">
          <button
            onClick={back}
            disabled={step === 1}
            className={`px-3 py-1 rounded border ${step === 1 ? 'opacity-50' : 'hover:bg-gray-50'}`}
          >
            Voltar
          </button>

          {step < 7 ? (
            <button
              onClick={next}
              disabled={!canNext}
              className={`px-3 py-1 rounded ${canNext ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}
            >
              Próximo
            </button>
          ) : (
            <button onClick={addToQuote} className="px-3 py-1 rounded bg-emerald-600 text-white">
              Adicionar ao orçamento
            </button>
          )}
        </div>
      </div>

      {/* ajuda do passo atual */}
      <p className="text-sm text-gray-600 bg-white border border-t-0 rounded-b p-3"
        aria-live="polite">
        {STEP_HELP[step]}
      </p>
    </div>


      <div className="bg-white border rounded p-4">
        {step === 1 && (
          <div className="bg-white border rounded p-4">
            <WirePicker
              value={wireType}
              meters={metragem}
              onChange={setWireType}
              onChangeMeters={setMetragem}
            />
          </div>
        )}

        {step === 2 && <GaugePicker value={bitola} onChange={setBitola} />}
        {step === 3 && <ColorPicker value={cor} onChange={setCor} />}

        {step === 4 && (
          <div className="space-y-3">
            <TerminalPicker
              title="Terminal A"
              value={termA}
              onChange={setTermA}
              bitola={bitola}  
              renderBelow={(id) =>
                NEEDS_HOLE.has(id) && (
                  <div className="space-y-1 text-center">
                    <div className="text-[11px] leading-tight text-gray-600">Furo (A)</div>
                    <select
                      className="border rounded p-2 w-full max-w-[120px] text-sm"
                      value={termAHole ?? ''}
                      onChange={(e) => setTermAHole(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="" disabled>Selecione</option>
                      {getHoleOptions(bitola, id).map(mm => (
                        <option key={mm} value={mm}>M{mm}</option>
                      ))}
                    </select>
                  </div>
                )
              }
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <TerminalPicker
              title="Terminal B"
              value={termB}
              onChange={setTermB}
              bitola={bitola}  
              renderBelow={(id) =>
                NEEDS_HOLE.has(id) && (
                  <div className="space-y-1 text-center">
                    <div className="text-[11px] leading-tight text-gray-600">Furo (B)</div>
                    <select
                      className="border rounded p-2 w-full max-w-[120px] text-sm"
                      value={termBHole ?? ''}
                      onChange={(e) => setTermBHole(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="" disabled>Selecione</option>
                      {getHoleOptions(bitola, id).map(mm => (
                        <option key={mm} value={mm}>M{mm}</option>
                      ))}
                    </select>
                  </div>
                )
              }
            />
          </div>
        )}


        {step === 6 && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* LADO A */}
              <div className="space-y-3">
                <IdentifierPicker
                  title="Identificador lado A"
                  value={idTypeA}
                  selectedColor={colorA}
                  onColorChange={setColorA}
                  bitolaMm2={bitola}
                  onChange={(v) => {
                    setIdTypeA(v);
                    if (v === 'none') setIdTextA('');
                  }}
                  renderBelow={(id) =>
                    id !== 'none' && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-gray-600">Texto lado A</div>
                        <input
                          type="text" maxLength={24}
                          className="border rounded p-2 w-full text-sm"
                          placeholder="EX.: S2-21.1"
                          value={idTextA}
                          onChange={(e)=>setIdTextA(e.target.value.toUpperCase())}
                        />
                        <div className="text-[11px] text-gray-500">Máx. 8 caracteres</div>
                      </div>
                    )
                  }
                />
              </div>

              {/* LADO B */}
              <div className="space-y-3">
                <IdentifierPicker
                  title="Identificador lado B"
                  value={idTypeB}
                  selectedColor={colorB}
                  onColorChange={setColorB}
                  bitolaMm2={bitola}
                  onChange={(v) => {
                    setIdTypeB(v);
                    if (v === 'none') setIdTextB('');
                  }}
                  renderBelow={(id) =>
                    id !== 'none' && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-gray-600">Texto lado B</div>
                        <input
                          type="text" maxLength={24}
                          className="border rounded p-2 w-full text-sm"
                          placeholder="EX.: S2-21.1"
                          value={idTextB}
                          onChange={(e)=>setIdTextB(e.target.value.toUpperCase())}
                        />
                        <div className="text-[11px] text-gray-500">Máx. 8 caracteres</div>
                      </div>
                    )
                  }
                />
                <button
                  type="button"
                  onClick={()=>{ setIdTypeB(idTypeA); setIdTextB(idTextA); }}
                  className="text-xs underline text-gray-600 hover:text-gray-800"
                >
                  Copiar do lado A
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Quantidade deste cabo</div>
            <input
              type="number" min={1}
              className="border rounded p-2 w-32"
              value={qty}
              onChange={(e)=>setQty(Math.max(1, parseInt(e.target.value || '1')))}
            />
            <div className="text-sm text-gray-600">
              Preço unitário (estimado): <b>R$ {unitPrice.toFixed(2)}</b>
            </div>
            <div className="text-sm text-gray-600">
              Subtotal: <b>R$ {(unitPrice * qty).toFixed(2)}</b>
            </div>
          </div>
        )}
      </div>

      {/* ========= BLOCÃO DO ORÇAMENTO (VIRA O PDF) ========= */}
      <div id="orcamento" className="bg-white border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Orçamento</h2>
          <div className="text-sm text-gray-500">Itens: {items.length}</div>
        </div>

        {items.length === 0 ? (
          <div className="text-gray-500 text-sm">Nenhum item ainda. Monte um cabo e clique “Adicionar ao orçamento”.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Qtd</th>
                    <th className="py-2 pr-4">Metragem</th>
                    <th className="py-2 pr-4">Bitola</th>
                    <th className="py-2 pr-4">Cor</th>
                    <th className="py-2 pr-4">Terminal A</th>
                    <th className="py-2 pr-4">Furo A</th>
                    <th className="py-2 pr-4">Terminal B</th>
                    <th className="py-2 pr-4">Furo B</th>
                    <th className="py-2 pr-4">Ident. A</th>
                    <th className="py-2 pr-4">Texto A</th>
                    <th className="py-2 pr-4">Ident. B</th>
                    <th className="py-2 pr-4">Texto B</th>
                    <th className="py-2 pr-4">Unitário</th>
                    <th className="py-2 pr-4">Subtotal</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} className="border-b">
                      <td className="py-2 pr-4">{it.qty}</td>
                      <td className="py-2 pr-4">{it.metragem} m</td>
                      <td className="py-2 pr-4">{it.bitola} mm²</td>
                      <td className="py-2 pr-4">{nomeDaCor(it.cor)}</td>
                      <td className="py-2 pr-4">{it.termA}</td>
                      <td className="py-2 pr-4">{it.termAHole ? `${it.termAHole} mm` : '-'}</td>
                      <td className="py-2 pr-4">{it.termB}</td>
                      <td className="py-2 pr-4">{it.termBHole ? `${it.termBHole} mm` : '-'}</td>
                      <td className="py-2 pr-4">
                        {(labelOrDash(it.identifierTypeA) ?? '—') +
                          (it.markerColorA ? ` - ${cap(it.markerColorA)}` : '')}
                      </td>
                      <td className="py-2 pr-4">{it.identifierTextA || '—'}</td>
                      <td className="py-2 pr-4">
                        {(labelOrDash(it.identifierTypeB) ?? '—') +
                          (it.markerColorB ? ` - ${cap(it.markerColorB)}` : '')}
                      </td>
                      <td className="py-2 pr-4">{it.identifierTextB || '—'}</td>
                      <td className="py-2 pr-4">R$ {it.unitPrice.toFixed(2)}</td>
                      <td className="py-2 pr-4">R$ {it.subtotal.toFixed(2)}</td>
                      <td className="py-2 pr-4">
                        <button
                          className="text-red-600 hover:underline"
                          onClick={()=>setItems(prev=>prev.filter(p=>p.id!==it.id))}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button className="text-sm text-gray-600 hover:underline" onClick={()=>setItems([])}>
                Limpar orçamento
              </button>
              <div className="text-xl font-semibold">Total: R$ {total.toFixed(2)}</div>
            </div>
          </>
        )}
      </div>

      {/* Botão FINALIZAR (e-mail com PDF) */}
      <div className="flex justify-end">
        <FinalizarOrcamento itens={items as any} total={total} />
      </div>
    </div>
  );
}
