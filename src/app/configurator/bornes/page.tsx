'use client';

import React, { useEffect, useMemo, useState } from 'react';
import FinalizarOrcamento from '@/components/FinalizarOrcamento';


// ===== botões mais nítidos =====
const btnBase =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[.98]";

const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600 shadow-sm`;
const btnOutline = `${btnBase} border border-blue-300 text-blue-700 bg-blue-50/40 hover:bg-blue-100 focus:ring-blue-300`;
const btnGhost   = `${btnBase} border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300`;
const btnDanger  = `${btnBase} border border-rose-300 text-rose-700 bg-rose-50/40 hover:bg-rose-100 focus:ring-rose-300`;


/** ===================== CONFIGS GERAIS ===================== */
const HORA_MO = 120;         // R$/hora (preço de venda)
const T_SEG_POR_PECA = 2;   // segundos por marcador impresso/aplicado
const MO_UNIT = +(HORA_MO / 3600 * T_SEG_POR_PECA).toFixed(4);

type BorneKey = 'uct4.1' | 'uct4.2' | 'uct6' | 'uct8' | 'duplo2n';
type MarkerPos = 'top' | 'lateral';
type MarkerColor = 'branco';

const COLOR_LABEL: Record<MarkerColor, string> = { branco: 'Branco' };

type Family =
  | 'UCT-TM4'  | 'UCT-TMF4'
  | 'UCT-TM5'  | 'UCT-TMF5'
  | 'UCT-TM6'  | 'UCT-TMF6'
  | 'UCT-TM8'  | 'UCT-TMF8';

type BorneSpec = {
  id: BorneKey;
  titulo: string;
  subtitulo?: string;
  campoTexto: { largura: number; altura: number }; // mm
  canal: number; // mm
  referencias?: string[];
  maxCharsByPos: Record<MarkerPos, number>;
  precoMaterial: number; // R$ por etiqueta (materiais)
  Svg?: React.FC<React.SVGProps<SVGSVGElement>>;
  previewTopSrc?: string;
  previewLatSrc?: string;

  /** Família/cartela por posição e layout (linhas → colunas). */
  familyByPos: Record<MarkerPos, Family>;
  layoutByPos: Record<MarkerPos, number[]>; // ex.: [7,7,...]  (soma = total de etiquetas)
};

// Ícones simples dos cards
const TagSvg: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 120 72" {...props}>
    <rect x="8" y="10" width="104" height="52" rx="10" fill="currentColor" opacity="0.08"/>
    <rect x="18" y="28" width="84" height="16" rx="4" stroke="currentColor" fill="none" strokeWidth="2"/>
  </svg>
);
const DoubleTagSvg: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 120 72" {...props}>
    <rect x="8" y="8" width="104" height="56" rx="10" fill="currentColor" opacity="0.08"/>
    <rect x="18" y="20" width="84" height="12" rx="3" stroke="currentColor" fill="none" strokeWidth="2"/>
    <rect x="18" y="40" width="84" height="12" rx="3" stroke="currentColor" fill="none" strokeWidth="2"/>
  </svg>
);


/** ====== ESPECIFICAÇÕES ======
 *  Ajuste familyByPos se preferir TM5/TMF5 para 2,5 mm (aqui deixei TM4/TMF4 por canal 4,2 mm).
 */
const BORNE_SPECS: BorneSpec[] = [
  {
    id: 'uct4.1',
    titulo: 'PT 2,5 - Bornes 2,5 mm²',
    campoTexto: { largura: 10.5, altura: 4.6 },
    canal: 4.2,
    referencias: ['3209510 | 3209523 | 3209536'],
    maxCharsByPos: { top: 2, lateral: 2 },
    precoMaterial: 0.24,
    Svg: TagSvg,
    previewTopSrc: '/images/Identificao_superior_borne.png',
    previewLatSrc: '/images/Identificao_lateral_borne.png',
    familyByPos: { top: 'UCT-TM5', lateral: 'UCT-TMF5' }, // troque para TM5/TMF5 se desejar
    layoutByPos: { top: Array(12).fill(6), lateral: Array(12).fill(6) }, // 12 x 6 = 72
  },
  {
    id: 'uct4.2',
    titulo: 'PT 4 - Bornes 4 mm²',
    campoTexto: { largura: 10.5, altura: 5.6 },
    canal: 4.2,
    referencias: ['3211757 | 3211760 | 3211766'],
    maxCharsByPos: { top: 2, lateral: 2 },
    precoMaterial: 0.31,
    Svg: TagSvg,
    previewTopSrc: '/images/Identificao_superior_borne.png',
    previewLatSrc: '/images/Identificao_lateral_borne.png',
    familyByPos: { top: 'UCT-TM6', lateral: 'UCT-TMF6' },
    layoutByPos: { top: Array(10).fill(6), lateral: Array(10).fill(6) }, // 10 x 6 = 60
  },
  {
    id: 'uct6',
    titulo: 'PT 6 - Bornes 6 mm²',
    campoTexto: { largura: 10.5, altura: 7.6 },
    canal: 6.2,
    referencias: ['3211813 | 3211819 | 3211822'],
    maxCharsByPos: { top: 2, lateral: 2 },
    precoMaterial: 0.62,
    Svg: TagSvg,
    previewTopSrc: '/images/Identificao_superior_borne.png',
    previewLatSrc: '/images/Identificao_lateral_borne.png',
    familyByPos: { top: 'UCT-TM8', lateral: 'UCT-TMF8' },
    layoutByPos: { top: Array(7).fill(6), lateral: Array(7).fill(6) }, // 7 x 6 = 42
  },
  {
    id: 'duplo2n',
    titulo: 'PTTB 2,5 - Bornes Dois Níveis',
    campoTexto: { largura: 10.5, altura: 4.6 },
    canal: 4.2,
    referencias: ['3210567'],
    maxCharsByPos: { top: 2, lateral: 2 },
    precoMaterial: 0.24,
    Svg: DoubleTagSvg,
    previewLatSrc: '/images/Identificao_lateral_borne_2_nivel.png', // só lateral
    familyByPos: { top: 'UCT-TM5', lateral: 'UCT-TMF5' }, // top não usado
    layoutByPos: { top: Array(12).fill(6), lateral: Array(12).fill(6) }, // 12 x 6 = 72
  },
];

type CartItem = {
  id: string;
  tipo: BorneKey;
  pos: MarkerPos;
  color: MarkerColor;
  qty: number;        // total de posições por cartela
  cartelas: number;   // NOVO: quantidade de cartelas
  textos: string[];   // tamanho == qty ('' = sem identificação)
  unitPrice: number;  // materiais + MO por etiqueta
  subtotal: number;   // unitPrice * qty * cartelas
  preenchidas: number;
};

function currency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function suggestCartela(spec: BorneSpec, pos: MarkerPos) {
  return spec.familyByPos[pos];
}

/** Helpers de sequência */
function alphaAt(n: number) {
  return String.fromCharCode(65 + (n % 26));
}
function alphaSeq(len: number) {
  const out: string[] = [];
  let i = 0;
  while (out.length < len) {
    let n = i;
    let s = '';
    do {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    out.push(s);
    i++;
  }
  return out;
}

/** ===================== PÁGINA ===================== */
export default function BornesPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tipo, setTipo] = useState<BorneKey>('uct4.1');
  const [pos, setPos] = useState<MarkerPos>('top');
  const [color, setColor] = useState<MarkerColor>('branco');

  const spec = useMemo(() => BORNE_SPECS.find(s => s.id === tipo)!, [tipo]);

  // PTTB 2,5 só lateral
  useEffect(() => { if (tipo === 'duplo2n') setPos('lateral'); }, [tipo]);

  // Layout/qty por posição (deps estáveis)
  const rows = useMemo(() => spec.layoutByPos[pos], [spec.id, pos]);
  const qty  = useMemo(() => rows.reduce((s, n) => s + n, 0), [rows]);

  // campos da cartela
  const [texts, setTexts] = useState<string[]>([]);
  const [blank, setBlank] = useState<boolean[]>([]);

  // limite de caracteres conforme a posição selecionada
  const maxChars = useMemo(() => spec.maxCharsByPos[pos], [spec.id, pos]);

  // NOVO: quantidade de cartelas (etapa 3)
  const [cartelas, setCartelas] = useState<number>(1);

  // recria os arrays quando muda qty
  useEffect(() => {
    setTexts(Array.from({ length: qty }, () => ''));
    setBlank(Array.from({ length: qty }, () => false));
  }, [qty]);

  // preços (por etiqueta)
  const materialUnit = spec.precoMaterial;
  const unitPrice = +(materialUnit + MO_UNIT).toFixed(2);

  // prévias de subtotal
  const subtotalCartela = +(unitPrice * qty).toFixed(2);             // uma cartela
  const subtotalMultiplicado = +(subtotalCartela * cartelas).toFixed(2); // n cartelas

  const canNext =
    (step === 1 && !!tipo && !!color && !!pos) ||
    (step === 2 && texts.length === qty && blank.length === qty) ||
    (step === 3 && cartelas >= 1);

  const [items, setItems] = useState<CartItem[]>([]);

  function addToCart() {
    if (step !== 3 || !canNext) return;
    const filled = texts.filter((t, i) => !blank[i] && t.trim().length > 0).length;
    const item: CartItem = {
      id: crypto.randomUUID(),
      tipo,
      pos,
      color,
      qty,
      cartelas,
      textos: texts.map((t, i) => (blank[i] ? '' : t.trim().toUpperCase())),
      unitPrice,
      subtotal: +(unitPrice * qty * cartelas).toFixed(2),
      preenchidas: filled,
    };
    setItems(prev => [...prev, item]);

    // reset simples
    setStep(1);
    setTipo('uct4.1');
    setColor('branco');
    setPos('top');
    setCartelas(1);
  }

  const previewSrc = pos === 'top' ? spec.previewTopSrc : spec.previewLatSrc;
  const total = items.reduce((s, it) => s + it.subtotal, 0);

  // helpers etapa 2
  const [onlyEmpty, setOnlyEmpty] = useState(true);

  const marcarRestantesComoBranco = () => {
    setBlank(b => b.map((flag, i) => (texts[i].trim() ? flag : true)));
  };
  const desmarcarTodos = () => setBlank(b => b.map(() => false));

  const limparIdentificacoes = () => {
    setTexts(arr => arr.map(() => ''));
    // Para também desmarcar "Sem identificação", descomente:
    // setBlank(b => b.map(() => false));
  };

  const fillNumeric = () => {
    setTexts(prev => {
      const next = [...prev];
      let n = 1;
      for (let i = 0; i < next.length; i++) {
        if (blank[i]) continue;
        if (onlyEmpty && next[i].trim()) continue;
        next[i] = String(n++);
      }
      return next;
    });
  };

  const fillAlphabet = () => {
    const seq = alphaSeq(qty);
    setTexts(prev => {
      const next = [...prev];
      let p = 0;
      for (let i = 0; i < next.length; i++) {
        if (blank[i]) continue;
        if (onlyEmpty && next[i].trim()) continue;
        next[i] = seq[p++];
      }
      return next;
    });
  };

  const STEP_HELP: Record<number, React.ReactNode> = {
    1: <>Passo 1: Escolha o <b>tipo</b> do borne, a <b>posição</b> (superior/lateral) da identificação.<br/></>,
    2: (
      <>
        <b>Passo 2:</b> Digite as <b>legendas</b> ou marque “Sem identificação”. <br></br>Opções:.
        <span className="ml-2 text-xs text-gray-600 leading-tight">
          • 🔢 <b>Seq. num</b> preenche os campos com números consecutivos (1, 2, 3…). 
          • 🔠 <b>Seq. alfa</b> preenche com letras (A, B, C…). • ➕ <b>Restantes “Sem id.”</b> • 🚫 <b>Desmarcar</b> • 🧹 <b>Limpar</b>
        </span>
      </>
    ),
    3: <>Passo 3: Informe a <b>quantidade de cartelas</b> com esta mesma identificação.</>,
    };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Identificação de Bornes</h1>
      </header>

      {/* Barra de passos */}
      <div className="flex items-center justify-between bg-white border rounded p-3">
        <div>Passo <b>{step}</b> de 3</div>
        <div className="space-x-2">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}
            disabled={step === 1}
            className={`px-3 py-1 rounded border ${step===1?'opacity-50':'hover:bg-gray-50'}`}
          >
            Voltar
          </button>

          {step < 3 ? (
            <button
              onClick={() => canNext && setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={!canNext}
              className={`px-3 py-1 rounded ${canNext?'bg-blue-600 text-white':'bg-gray-300 text-gray-600'}`}
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={addToCart}
              disabled={!canNext}
              className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
            >
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

      {/* ===== PASSO 1 ===== */}
      {step === 1 && (
        <section className="grid lg:grid-cols-3 gap-6">
          {/* Tipos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="text-sm font-medium">Tipo do borne</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BORNE_SPECS.map((b) => {
                const active = tipo === b.id;
                const Svg = b.Svg ?? TagSvg;
                return (
                  <button
                    key={b.id}
                    onClick={() => setTipo(b.id)}
                    className={`text-left w-full rounded-xl border p-4 bg-white hover:bg-gray-50 transition
                      ${active ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Svg className="w-20 h-12 text-gray-700" />
                      <div>
                        <div className="font-medium">{b.titulo}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] text-gray-600">
                       Máx.: {b.maxCharsByPos.top} caracteres
                    </div>
                    {!!b.referencias?.length && (
                      <div className="mt-1 text-[11px] text-gray-500">Refs.: {b.referencias.join(' • ')}</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Cor */}
            <div className="pt-2">
              <div className="text-sm font-medium mb-2">Cor da cartela</div>
              <div className="flex gap-3">
                {(['branco'] as MarkerColor[]).map(c => {
                  const selected = color === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 bg-white
                        ${selected ? 'ring-2 ring-blue-600 ring-offset-2' : 'hover:bg-gray-50'}`}
                    >
                      <span className="inline-block w-5 h-5 rounded border"
                        style={{ background: c === 'branco' ? '#fff' : '#F7D848' }} />
                      <span className="text-sm">{COLOR_LABEL[c]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Posição + preview + resumo */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Posição do marcador</div>

            <div className="grid grid-cols-2 gap-3">
              {/* SUPERIOR */}
              <button
                onClick={() => tipo !== 'duplo2n' && setPos('top')}
                disabled={tipo === 'duplo2n'}
                className={`rounded-xl border p-3 bg-white text-center ${
                  pos==='top' ? 'ring-2 ring-blue-600 ring-offset-2' : 'hover:bg-gray-50'
                } ${tipo==='duplo2n' ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={tipo==='duplo2n' ? 'PTTB 2,5 só permite lateral' : 'Marcação superior'}
                aria-pressed={pos==='top'}
              >
                <div className="text-sm font-medium mb-2">Superior</div>
                <svg viewBox="0 0 180 100" className="mx-auto">
                  <rect x="12" y="20" width="156" height="60" rx="12" fill="#f3f4f6"/>
                  <rect x="45" y="38" width="90" height="24" rx="6" fill="#fff" stroke="#2563eb" strokeWidth="3"/>
                </svg>
              </button>

              {/* LATERAL */}
              <button
                onClick={() => setPos('lateral')}
                className={`rounded-xl border p-3 bg-white text-center ${
                  pos==='lateral' ? 'ring-2 ring-blue-600 ring-offset-2' : 'hover:bg-gray-50'
                }`}
                aria-pressed={pos==='lateral'}
              >
                <div className="text-sm font-medium mb-2">Lateral</div>
                <svg viewBox="0 0 180 100" className="mx-auto">
                  <rect x="80" y="6" width="20" height="98" rx="6" fill="#f3f4f6"/>
                  <rect x="78" y="6" width="24" height="25" rx="6" fill="#fff" stroke="#2563eb" strokeWidth="3"/>
                </svg>
              </button>
            </div>

            {/* Preview por IMAGEM */}
            <div className="rounded-xl border p-3 bg-white">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc} alt={`Pré-visualização ${pos === 'top' ? 'superior' : 'lateral'}`}
                     className="w-full h-auto rounded" />
              ) : (
                <div className="text-sm text-gray-500 p-6 text-center">
                  Adicione a imagem real em <code>{pos==='top' ? spec.previewTopSrc : spec.previewLatSrc}</code>
                </div>
              )}
            </div>

            {/* Dica + preços */}
            <div className="rounded-xl border p-3 bg-gray-50 text-sm text-gray-700">
              <div>
                Cartela: <b>{suggestCartela(spec, pos)}</b>
                {' '}• Posições por cartela: <b>{qty}</b>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== PASSO 2 ===== */}
      {step === 2 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold">
              Digite as legendas — cartela {qty} posições • marque “Sem identificação” para deixar em branco
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm flex items-center gap-2 mr-1">
                <input type="checkbox" checked={onlyEmpty} onChange={e => setOnlyEmpty(e.target.checked)} />
                Somente vazios
              </label>

              {/* Grupo visual dos botões */}
              <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                <button onClick={fillNumeric}   className={btnOutline} title="Preencher 1..N">
                  Sequencial numérico
                </button>
                <button onClick={fillAlphabet}  className={btnOutline} title="Preencher A..Z, AA..">
                  Sequencial alfabético
                </button>

                <span className="w-px h-6 bg-gray-200 self-center" />

                <button onClick={marcarRestantesComoBranco} className={btnOutline}
                        title="Marca 'Sem identificação' nas posições ainda vazias">
                  Marcar restantes como “Sem identificação”
                </button>
                <button onClick={desmarcarTodos} className={btnGhost}>
                  Desmarcar todos
                </button>

                <span className="w-px h-6 bg-gray-200 self-center" />

                <button onClick={limparIdentificacoes} className={btnDanger}
                        title="Apaga todos os textos (mantém 'Sem identificação')">
                  Limpar identificações
                </button>
              </div>
            </div>
          </div>

          {/* GRADE CONFORME LAYOUT */}
          <div className="rounded-xl border bg-white p-4">
            <div className="space-y-4">
              {rows.map((cols, rowIdx) => {
                let acc = 0; for (let i = 0; i < rowIdx; i++) acc += rows[i];
                const startIndex = acc;

                return (
                  <div key={rowIdx}
                       className="grid"
                       style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '0.75rem' }}>
                    {Array.from({ length: cols }).map((_, colIdx) => {
                      const idx = startIndex + colIdx;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] text-gray-500">#{idx + 1}</div>
                            <label className="text-[11px] text-gray-700 flex items-center gap-1 select-none">
                              <input
                                type="checkbox"
                                tabIndex={-1}
                                checked={blank[idx]}
                                onChange={(e) => {
                                  const v = e.target.checked;
                                  setBlank((arr) => { const n = [...arr]; n[idx] = v; return n; });
                                  if (v) setTexts((arr) => { const n = [...arr]; n[idx] = ''; return n; });
                                }}
                              />
                              Sem identificação
                            </label>
                          </div>
                          <input
                            type="text"
                            disabled={blank[idx]}
                            maxLength={maxChars}
                            className="w-full rounded border bg-white p-2 text-sm text-center tracking-wide disabled:bg-gray-100 disabled:text-gray-400"
                            placeholder="DIGITE AQUI"
                            value={texts[idx]}
                            onChange={(e) => {
                              const v = e.target.value.toUpperCase();
                              setTexts((arr) => { const n = [...arr]; n[idx] = v; return n; });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-sm text-gray-700">
            Posição: <b>{pos === 'top' ? 'Superior' : 'Lateral'}</b> • Cor: <b>{COLOR_LABEL[color]}</b> •
            Preenchidas: <b>{texts.filter((t, i) => !blank[i] && t.trim()).length}/{qty}</b> •
            Unitário (por etiq.): <b>{currency(unitPrice)}</b> — Subtotal (1 cartela): <b>{currency(subtotalCartela)}</b>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(3)}
              className={btnPrimary}
            >
              Prosseguir para a quantidade de cartelas
            </button>
          </div>
        </section>
      )}

      {/* ===== PASSO 3 ===== */}
      {step === 3 && (
        <section className="space-y-4">
          <div className="text-lg font-semibold">Quantidade de cartelas</div>

          <div className="rounded-xl border bg-white p-4 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Cartelas com esta identificação</label>
              <input
                type="number"
                min={1}
                step={1}
                value={cartelas}
                onChange={(e) => setCartelas(Math.max(1, Math.floor(Number(e.target.value || '1'))))}
                className="w-40 rounded border p-2"
              />
              <div className="text-xs text-gray-600 mt-1">
                Cada cartela possui <b>{qty}</b> posições. Subtotal por cartela: <b>{currency(subtotalCartela)}</b>.
              </div>
            </div>

            <div className="text-sm bg-gray-50 border rounded p-3">
              <div>Unitário (por etiq.): <b>{currency(unitPrice)}</b></div>
              <div>Posições por cartela: <b>{qty}</b></div>
              <div>Subtotal (1 cartela): <b>{currency(subtotalCartela)}</b></div>
              <div className="text-base mt-2">
                <b>Total desta seleção:</b> {currency(subtotalMultiplicado)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-3 py-1 rounded border hover:bg-gray-50"
            >
              Voltar às identificações
            </button>
            <button
              onClick={addToCart}
              disabled={!canNext}
              className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
            >
              Adicionar ao orçamento
            </button>
          </div>
        </section>
      )}

      {/* ===== ORÇAMENTO ===== */}
      <section id="orcamento" className="bg-white border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Orçamento</h2>
          <div className="text-sm text-gray-500">Itens: {items.length}</div>
        </div>

        {items.length === 0 ? (
          <div className="text-gray-500 text-sm">Nenhum item ainda. Monte e clique “Adicionar ao orçamento”.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Cartelas</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Posição</th>
                    <th className="py-2 pr-4">Cor</th>
                    <th className="py-2 pr-4">Preenchidas</th>
                    <th className="py-2 pr-4">Unitário (por etiq.)</th>
                    <th className="py-2 pr-4">Subtotal</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const b = BORNE_SPECS.find(s => s.id === it.tipo)!;
                    return (
                      <React.Fragment key={it.id}>
                        <tr className="border-b align-top">
                          <td className="py-2 pr-4">
                            <div className="font-medium">{it.cartelas}× cartela(s)</div>
                            <div className="text-[11px] text-gray-500">{it.qty} posições por cartela</div>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="font-medium">{b.titulo}</div>
                            <div className="text-[11px] text-gray-500">
                              Canal {b.canal} mm • {b.campoTexto.largura}×{b.campoTexto.altura} mm
                            </div>
                          </td>
                          <td className="py-2 pr-4">{it.pos === 'top' ? 'Superior' : 'Lateral'}</td>
                          <td className="py-2 pr-4">{COLOR_LABEL[it.color]}</td>
                          <td className="py-2 pr-4">{it.preenchidas}/{it.qty}</td>
                          <td className="py-2 pr-4">{currency(it.unitPrice)}</td>
                          <td className="py-2 pr-4">{currency(it.subtotal)}</td>
                          <td className="py-2 pr-4">
                            <button className="text-red-600 hover:underline"
                              onClick={() => setItems(prev => prev.filter(p => p.id !== it.id))}>
                              Remover
                            </button>
                          </td>
                        </tr>

                        {/* Lista enumerada 1#, 2#, ... — SEM <details>, para sair no PDF */}
                        <tr className="border-b">
                          <td colSpan={8} className="py-3">
                            <div className="text-sm font-medium mb-1">
                              Lista de identificações ({it.preenchidas}/{it.qty}) — {suggestCartela(b, it.pos)}
                            </div>
                            <ol className="list-decimal pl-5 text-sm leading-6 whitespace-pre-wrap">
                              {it.textos.map((t, i) => (
                                <li key={i}>
                                  {`${i + 1}# `}{t && t.trim().length ? t : 'SEM IDENTIFICAÇÃO'}
                                </li>
                              ))}
                            </ol>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                *A cartela é produzida completa. Posições marcadas como “Sem identificação” vão <b>em branco</b>.
              </div>
              <div className="text-xl font-semibold">Total: {currency(total)}</div>
            </div>
          </>
        )}
      </section>

      {/* Finalizar orçamento por e-mail */}
      <div className="flex justify-end">
        <FinalizarOrcamento itens={items as any} total={total} />
      </div>
    </main>
  );
}
