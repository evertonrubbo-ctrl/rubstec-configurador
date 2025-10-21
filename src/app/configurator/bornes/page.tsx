'use client';

import React, { useEffect, useMemo, useState } from 'react';
import FinalizarOrcamento from '@/components/FinalizarOrcamento';

/* ===== Botões ===== */
const btnBase =
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ' +
  'focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[.98]';
const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600 shadow-sm`;
const btnOutline = `${btnBase} border border-blue-300 text-blue-700 bg-blue-50/40 hover:bg-blue-100 focus:ring-blue-300`;
const btnDanger  = `${btnBase} border border-rose-300 text-rose-700 bg-rose-50/40 hover:bg-rose-100 focus:ring-rose-300`;

/* ===== Custos ===== */
const HORA_MO = 120;
const T_SEG_POR_PECA = 2;
const MO_UNIT = +(HORA_MO / 3600 * T_SEG_POR_PECA).toFixed(4);

/* ===== Layout helpers ===== */
// espaçamento entre etiquetas (quase “grudadas”)
const CELL_GAP = 6; // px

type BorneKey    = 'uct4.1' | 'uct4.2' | 'uct6' | 'uct8' | 'duplo2n';
type MarkerPos   = 'top' | 'lateral';
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
  campoTexto: { largura: number; altura: number }; // mm (informativo)
  canal: number;                                   // mm (informativo)
  referencias?: string[];
  maxCharsByPos: Record<MarkerPos, number>;        // informativo
  precoMaterial: number;                           // R$ por etiqueta (material)
  Svg?: React.FC<React.SVGProps<SVGSVGElement>>;
  previewTopSrc?: string;
  previewLatSrc?: string;
  familyByPos: Record<MarkerPos, Family>;
  layoutByPos: Record<MarkerPos, number[]>;        // linhas → colunas (soma = total)
};

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

/* ===== Especificações ===== */
const BORNE_SPECS: BorneSpec[] = [
  {
    id: 'uct4.1',
    titulo: 'PT 2,5 - Bornes 2,5 mm²',
    campoTexto: { largura: 10.5, altura: 4.6 },
    canal: 4.2,
    referencias: ['3209510 | 3209523 | 3209536'],
    maxCharsByPos: { top: 4, lateral: 2 },
    precoMaterial: 0.24,
    Svg: TagSvg,
    previewTopSrc: '/images/Identificao_superior_borne.png',
    previewLatSrc: '/images/Identificao_lateral_borne.png',
    familyByPos: { top: 'UCT-TM5', lateral: 'UCT-TMF5' },
    layoutByPos: { top: Array(6).fill(12), lateral: Array(6).fill(12) },
  },
  {
    id: 'uct4.2',
    titulo: 'PT 4 - Bornes 4 mm²',
    campoTexto: { largura: 10.5, altura: 5.6 },
    canal: 4.2,
    referencias: ['3211757 | 3211760 | 3211766'],
    maxCharsByPos: { top: 4, lateral: 2 },
    precoMaterial: 0.31,
    Svg: TagSvg,
    previewTopSrc: '/images/Identificao_superior_borne.png',
    previewLatSrc: '/images/Identificao_lateral_borne.png',
    familyByPos: { top: 'UCT-TM6', lateral: 'UCT-TMF6' },
    layoutByPos: { top: Array(6).fill(10), lateral: Array(6).fill(10) },
  },
  {
    id: 'uct6',
    titulo: 'PT 6 - Bornes 6 mm²',
    campoTexto: { largura: 10.5, altura: 7.6 },
    canal: 6.2,
    referencias: ['3211813 | 3211819 | 3211822'],
    maxCharsByPos: { top: 4, lateral: 2 },
    precoMaterial: 0.62,
    Svg: TagSvg,
    previewTopSrc: '/images/Identificao_superior_borne.png',
    previewLatSrc: '/images/Identificao_lateral_borne.png',
    familyByPos: { top: 'UCT-TM8', lateral: 'UCT-TMF8' },
    layoutByPos: { top: Array(6).fill(7), lateral: Array(6).fill(7) },
  },
  {
    id: 'duplo2n',
    titulo: 'PTTB 2,5 - Bornes Dois Níveis',
    campoTexto: { largura: 10.5, altura: 4.6 },
    canal: 4.2,
    referencias: ['3210567'],
    maxCharsByPos: { top: 4, lateral: 2 },
    precoMaterial: 0.24,
    Svg: DoubleTagSvg,
    previewLatSrc: '/images/Identificao_lateral_borne_2_nivel.png',
    familyByPos: { top: 'UCT-TM5', lateral: 'UCT-TMF5' },
    layoutByPos: { top: Array(6).fill(12), lateral: Array(6).fill(12) },
  },
];

/* ===== Símbolos ===== */
const SYMBOLS = ['↑','↓','→','←','↔','↕','⏚','⚡','Ø','+','-'];

/* ===== Helpers ===== */
function currency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function suggestCartela(spec: BorneSpec, pos: MarkerPos) {
  return spec.familyByPos[pos];
}
function alphaSeq(len: number) {
  const out: string[] = [];
  let i = 0;
  while (out.length < len) {
    let n = i; let s = '';
    do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
    out.push(s); i++;
  }
  return out;
}
// “AABBCC” -> “AA\nBB\nCC”
const group2 = (s: string) => s.replace(/\s+/g, '').match(/.{1,2}/g)?.join('\n') ?? '';

/* ====== Logo Phoenix simplificado ====== */
const PhoenixLogo: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 70 70" className="text-black" aria-label="Phoenix Contact">
    <rect x="0" y="0" width="70" height="70" rx="10" fill="currentColor" />
    <circle cx="24" cy="24" r="12" fill="#fff" />
    <rect x="35" y="16" width="8" height="36" fill="#fff" />
  </svg>
);

/* ====== Moldura da cartela (estilo Thermomark) ====== */
const CartelaFrame: React.FC<{ children: React.ReactNode; title: string; }> = ({ children, title }) => (
  <div className="rounded border bg-[#efefef] p-3">
    <div className="flex items-center justify-between mb-2">
      <PhoenixLogo />
      <div className="text-sm text-gray-800 text-right leading-tight">
        <div className="font-semibold">{title}</div>
        <div className="text-xs">1</div>
      </div>
    </div>
    <div className="relative bg-white border-2 border-gray-500 rounded-sm" style={{ padding: 10 }}>
      <div className="absolute left-2 top-2 bottom-2 w-3 bg-gray-200 border border-gray-500" />
      <div className="absolute right-2 top-2 bottom-2 w-3 bg-gray-200 border border-gray-500" />
      <div className="space-y-2">{children}</div>
      <div className="mt-3 mx-auto h-4 w-28 rounded bg-emerald-400 border border-emerald-700" />
    </div>
  </div>
);

/* ===== Cálculo de tamanho da célula por posição ===== */
function getCellSize(pos: MarkerPos) {
  // Superior: mais largo/alto para caber 6 (2/2/2) quando horizontal
  // Lateral: estreito e alto, igual Phoenix, máx 2 chars (H e V)
  return pos === 'top'
    ? { w: 44, h: 84 }   // ajuste aqui se quiser
    : { w: 28, h: 64 };  // ajuste aqui se quiser (menor)
}

/* ===== Célula editável (digitação DIRETA na etiqueta azul) ===== */
type EditableCellProps = {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  vertical: boolean;
  maxChars: number;          // <<< NOVO: limite vindo de fora (2 p/ lateral; 4/6 p/ superior)
  widthFactor?: number;
  indexAria?: number;
  cellW: number;
  cellH: number;
};

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onChange,
  onFocus,
  vertical,
  maxChars,
  widthFactor = 1,
  indexAria,
  cellW,
  cellH,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  // Atualiza visual quando value/rotação mudam
  useEffect(() => {
    if (!ref.current) return;
    if (vertical) {
      ref.current.innerText = value;
    } else {
      // Se o limite for 2 (lateral), não há muito o que quebrar — ainda assim usamos group2 pra manter padrão
      ref.current.innerText = group2(value) || value;
    }
  }, [value, vertical]);

  // placeholder
  const phRaw = 'DIGITEAQUI';
  const placeholderText = vertical ? 'DIGITE AQUI' : (phRaw.match(/.{1,2}/g)?.join('\n') ?? 'DIGITE AQUI');

  return (
    <div className="flex justify-center" style={{ width: cellW }}>
      <div
        className="relative rounded-[3px]"
        style={{
          width: cellW,
          height: cellH,
          background: '#cfe7ff',
          border: '1px solid #7fb6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          ref={ref}
          role="textbox"
          aria-label={`#${indexAria ?? ''}`}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onFocus={onFocus}
          onInput={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            let raw = (el.textContent || '').toUpperCase().replace(/\s+/g, '');
            raw = raw.slice(0, maxChars);
            onChange(raw);

            if (vertical) {
              el.innerText = raw;
            } else {
              el.innerText = group2(raw) || raw;
            }

            // caret no fim
            const r = document.createRange();
            r.selectNodeContents(el);
            r.collapse(false);
            const s = window.getSelection();
            s?.removeAllRanges();
            s?.addRange(r);
          }}
          className="w-full h-full outline-none"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: '#111827',
            fontSize: 18,
            lineHeight: 1.05,
            whiteSpace: 'pre-line',
            textAlign: 'center',
            writingMode: vertical ? ('vertical-rl' as any) : ('horizontal-tb' as any),
            transform: vertical ? `rotate(180deg) scaleX(${widthFactor})` : `scaleX(${widthFactor})`,
            transformOrigin: 'center',
            padding: 0,
          }}
        />

        {!value && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-400"
            style={{
              fontWeight: 600,
              fontSize: 12,
              lineHeight: 1.05,
              whiteSpace: 'pre-line',
              textAlign: 'center',
              writingMode: vertical ? ('vertical-rl' as any) : ('horizontal-tb' as any),
              transform: vertical ? `rotate(180deg) scaleX(${widthFactor})` : `scaleX(${widthFactor})`,
              transformOrigin: 'center',
            }}
          >
            {placeholderText}
          </span>
        )}
      </div>
    </div>
  );
};

type CartItem = {
  id: string;
  tipo: BorneKey;
  pos: MarkerPos;
  color: MarkerColor;
  qty: number;
  cartelas: number;
  textos: string[];
  unitPrice: number;
  subtotal: number;
  preenchidas: number;
  rotate90: boolean;
  widthFactor: number;
  prefix: string;
  suffix: string;
};

export default function BornesPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tipo, setTipo] = useState<BorneKey>('uct4.1');
  const [pos, setPos] = useState<MarkerPos>('top');
  const [color, setColor] = useState<MarkerColor>('branco');
  const spec = useMemo(() => BORNE_SPECS.find(s => s.id === tipo)!, [tipo]);

  useEffect(() => { if (tipo === 'duplo2n') setPos('lateral'); }, [tipo]);

  const rows = useMemo(() => spec.layoutByPos[pos], [spec.id, pos]);
  const qty  = useMemo(() => rows.reduce((s, n) => s + n, 0), [rows]);

  // Etapa 2
  const [texts, setTexts] = useState<string[]>([]);
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  // começa marcado só quando for LATERAL
  const [rotate90, setRotate90] = useState<boolean>(pos === 'lateral'); // 90° marcado por padrão
  const [widthFactor] = useState<number>(1.0);
  const [lastFocused, setLastFocused] = useState<number | null>(null);

  // prefix/suffix
  const [prefix, setPrefix] = useState<string>('');
  const [suffix, setSuffix] = useState<string>('');

  // monta arrays ao mudar layout
  useEffect(() => {
    setTexts(Array.from({ length: qty }, () => ''));
    setLastFocused(null);
  }, [qty]);

  useEffect(() => {
  // lateral => 90° marcado; superior (horizontal) => 90° desmarcado
  setRotate90(pos === 'top');
  }, [pos]);


  // Limite por regra:
  // - Lateral => 2 (horizontal OU vertical)
  // - Superior => 4 (vertical) / 6 (horizontal, quebra 2/2/2)
  const charLimit = useMemo(() => {
    if (pos === 'lateral') return 2;
    return rotate90 ? 4 : 6;
  }, [pos, rotate90]);

  // ao mudar regra de limite, corta conteúdos
  useEffect(() => {
    setTexts(prev => prev.map(t => (t || '').slice(0, charLimit)));
  }, [charLimit]);

  // preços
  const materialUnit = spec.precoMaterial;
  const unitPrice = +(materialUnit + MO_UNIT).toFixed(2);
  const subtotalCartela = +(unitPrice * qty).toFixed(2);

  const withAffixes = (s: string) => `${prefix ?? ''}${s}${suffix ?? ''}`;

  const fillNumeric = () => {
    setTexts(prev => {
      const next = [...prev]; let n = 1;
      for (let i = 0; i < next.length; i++) {
        if (onlyEmpty && next[i].trim()) continue;
        next[i] = withAffixes(String(n++)).slice(0, charLimit);
      }
      return next;
    });
  };

  const fillAlphabet = () => {
    const seq = alphaSeq(qty);
    setTexts(prev => {
      const next = [...prev]; let p = 0;
      for (let i = 0; i < next.length; i++) {
        if (onlyEmpty && next[i].trim()) continue;
        next[i] = withAffixes(seq[p++]).slice(0, charLimit);
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
          • 🔠 <b>Seq. alfa</b> preenche com letras (A, B, C…). • 🚫 <b>Desmarcar</b> • 🧹 <b>Limpar</b>
        </span>
      </>
    ),
    3: <>Passo 3: Informe a <b>quantidade de cartelas</b> com esta mesma identificação.</>,
    };


  // Avançar de etapa com checagem de vazios no passo 2
  function handleNext() {
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      const vazios = texts.filter(t => !t.trim()).length;
      if (vazios > 0) {
        const ok = window.confirm(`Existem ${vazios} posição(ões) SEM preenchimento. Deseja prosseguir assim mesmo?`);
        if (!ok) return;
      }
      setStep(3);
    }
  }

  const [cartelas, setCartelas] = useState<number>(1);
  const [items, setItems] = useState<CartItem[]>([]);

  function addToCart() {
    if (step !== 3) return;
    const filled = texts.filter((t) => t.trim()).length;
    const item: CartItem = {
      id: crypto.randomUUID(),
      tipo, pos, color,
      qty, cartelas,
      textos: texts.map((t) => t.trim().toUpperCase()),
      unitPrice,
      subtotal: +(unitPrice * qty * cartelas).toFixed(2),
      preenchidas: filled,
      rotate90, widthFactor,
      prefix, suffix
    };
    setItems(prev => [...prev, item]);
    setStep(1); setTipo('uct4.1'); setPos('top'); setColor('branco');
    setCartelas(1); setRotate90(true);
    setPrefix(''); setSuffix('');
  }

  const previewSrc = pos === 'top' ? spec.previewTopSrc : spec.previewLatSrc;
  const total = items.reduce((s, it) => s + it.subtotal, 0);

  const { w: cellW, h: cellH } = getCellSize(pos);

  /* ========================= UI ========================= */
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Identificação de Bornes</h1>
      </header>

      {/* Passos topo */}
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
            <button onClick={handleNext} className="px-3 py-1 rounded bg-blue-600 text-white">
              Próximo
            </button>
          ) : (
            <button onClick={addToCart} className="px-3 py-1 rounded bg-emerald-600 text-white">
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

      {/* ===== PASSO 1 (inalterado visualmente) ===== */}
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
                      <div className="font-medium">{b.titulo}</div>
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
                      <span className="inline-block w-5 h-5 rounded border" style={{ background: '#fff' }} />
                      <span className="text-sm">{COLOR_LABEL[c]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Posição + preview */}
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

            {/* Preview */}
            <div className="rounded-xl border p-3 bg-white">
              {previewSrc ? (
                <img src={previewSrc} alt={`Pré-visualização ${pos === 'top' ? 'superior' : 'lateral'}`} className="w-full h-auto rounded" />
              ) : (
                <div className="text-sm text-gray-500 p-6 text-center">
                  Adicione a imagem real em <code>{pos==='top' ? spec.previewTopSrc : spec.previewLatSrc}</code>
                </div>
              )}
            </div>

            <div className="rounded-xl border p-3 bg-gray-50 text-sm text-gray-700">
              <div>Cartela: <b>{suggestCartela(spec, pos)}</b> • Posições por cartela: <b>{qty}</b></div>
            </div>
          </div>
        </section>
      )}

      {/* ===== PASSO 2 — digitação DIRETO na etiqueta ===== */}
      {step === 2 && (
        <section className="grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            {/* Opções rápidas */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-lg font-semibold">Digite as legendas — {qty} posições</div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" checked={onlyEmpty} onChange={(e)=>setOnlyEmpty(e.target.checked)} />
                  Somente vazios
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" checked={rotate90} onChange={(e)=>setRotate90(e.target.checked)} />
                  Rotação 90°
                </label>
              </div>
            </div>

            {/* Prefixo/Sufixo e preenchimentos */}
            <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3">
              <div>
                <label className="block text-sm font-medium">Prefixo</label>
                <input value={prefix} onChange={e=>setPrefix(e.target.value.toUpperCase())}
                       className="border rounded p-2 w-40" placeholder="ex.: A-" maxLength={6}/>
              </div>
              <div>
                <label className="block text-sm font-medium">Sufixo</label>
                <input value={suffix} onChange={e=>setSuffix(e.target.value.toUpperCase())}
                       className="border rounded p-2 w-40" placeholder="ex.: -B" maxLength={6}/>
              </div>

              <div className="flex gap-2 ml-auto">
                <button onClick={fillNumeric}  className={btnOutline}>Sequencial numérico</button>
                <button onClick={fillAlphabet} className={btnOutline}>Sequencial alfabético</button>
                <button onClick={()=>setTexts(arr=>arr.map(()=>''))} className={btnDanger}>Limpar</button>
              </div>
            </div>

            {/* CARTELA */}
            <CartelaFrame title={suggestCartela(spec, pos)}>
              {rows.map((cols, rowIdx) => {
                let acc = 0; for (let i = 0; i < rowIdx; i++) acc += rows[i];
                const startIndex = acc;

                return (
                  <div key={rowIdx} className="space-y-2">
                    {/* tarja amarela entre linhas */}
                    <div className="mx-auto h-4 w-28 rounded bg-yellow-300 border border-yellow-600" />
                    {/* linha (coladas) */}
                    <div
                      className="mx-auto"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
                        columnGap: `${CELL_GAP}px`,
                        rowGap: '0px',
                        justifyContent: 'center',
                      }}
                    >
                      {Array.from({ length: cols }).map((_, colIdx) => {
                        const idx = startIndex + colIdx;
                        const val = texts[idx];
                        return (
                          <EditableCell
                            key={idx}
                            value={val}
                            vertical={rotate90}
                            maxChars={charLimit}
                            widthFactor={1}
                            indexAria={idx + 1}
                            cellW={cellW}
                            cellH={cellH}
                            onFocus={() => setLastFocused(idx)}
                            onChange={(newVal) => {
                              setTexts(a => { const n=[...a]; n[idx]=newVal; return n; });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CartelaFrame>

            <div className="text-sm text-gray-700">
              Posição: <b>{pos === 'top' ? 'Superior' : 'Lateral'}</b> • Cor: <b>{COLOR_LABEL[color]}</b> •
              Preenchidas: <b>{texts.filter(t => t.trim()).length}/{qty}</b> •
              Limite por célula: <b>
                {pos==='lateral' ? '2 (H e V)' : (rotate90 ? '4 (vertical)' : '6 (horizontal • 2/linha)')}
              </b> • Unitário: <b>{currency(unitPrice)}</b> — Subtotal (1 cartela): <b>{currency(subtotalCartela)}</b>
            </div>

            <div className="flex justify-end">
              <button onClick={handleNext} className={btnPrimary}>
                Prosseguir para quantidade de cartelas
              </button>
            </div>
          </div>

          {/* Lateral: Símbolos */}
          <aside className="space-y-3">
            <div className="rounded-xl border bg-white p-3">
              <div className="text-sm font-medium mb-2">Símbolos</div>
              <div className="grid grid-cols-6 gap-2">
                {SYMBOLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={()=>{
                      if (lastFocused==null) return;
                      setTexts(prev=>{
                        const next=[...prev];
                        const cur = next[lastFocused] ?? '';
                        if (cur.length >= charLimit) return next;
                        next[lastFocused] = (cur + s).slice(0, charLimit);
                        return next;
                      });
                    }}
                    className="h-10 rounded border bg-gray-50 hover:bg-gray-100 text-lg font-semibold"
                    title={`Inserir ${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                No horizontal (superior), o texto quebra em 3 linhas (2/2/2). Na lateral o limite é 2 em qualquer orientação.
              </div>
            </div>

            <div className="rounded-xl border bg-white p-3 text-sm">
              <div className="font-medium mb-1">Layout</div>
              <div>Cartela: <b>{suggestCartela(spec, pos)}</b></div>
              <div>Posições: <b>{qty}</b></div>
              <div>Máx. caracteres: <b>{charLimit}</b></div>
              <div>Rotação: <b>{rotate90 ? '90° (vertical)' : '0° (horizontal)'}</b></div>
            </div>
          </aside>
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
                type="number" min={1} step={1}
                value={cartelas}
                onChange={(e)=>setCartelas(Math.max(1, Math.floor(Number(e.target.value||'1'))))}
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
                <b>Total desta seleção:</b> {currency(+(unitPrice * qty * cartelas).toFixed(2))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={()=>setStep(2)} className="px-3 py-1 rounded border hover:bg-gray-50">
              Voltar às identificações
            </button>
            <button onClick={addToCart} className="px-4 py-2 rounded bg-emerald-600 text-white">
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
                    <th className="py-2 pr-4">Rotação</th>
                    <th className="py-2 pr-4">Unitário</th>
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
                            <div className="text-[11px] text-gray-500">{it.qty} posições</div>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="font-medium">{b.titulo}</div>
                            <div className="text-[11px] text-gray-500">
                              {suggestCartela(b, it.pos)} • {b.campoTexto.largura}×{b.campoTexto.altura} mm
                            </div>
                          </td>
                          <td className="py-2 pr-4">{it.pos === 'top' ? 'Superior' : 'Lateral'}</td>
                          <td className="py-2 pr-4">{COLOR_LABEL[it.color]}</td>
                          <td className="py-2 pr-4">{it.preenchidas}/{it.qty}</td>
                          <td className="py-2 pr-4">{it.rotate90 ? '90° (vertical)' : '0° (horizontal)'}</td>
                          <td className="py-2 pr-4">{currency(it.unitPrice)}</td>
                          <td className="py-2 pr-4">{currency(it.subtotal)}</td>
                          <td className="py-2 pr-4">
                            <button className="text-red-600 hover:underline"
                                    onClick={() => setItems(prev => prev.filter(p => p.id !== it.id))}>
                              Remover
                            </button>
                          </td>
                        </tr>

                        <tr className="border-b">
                          <td colSpan={9} className="py-3">
                            <div className="text-sm font-medium mb-1">
                              Lista de identificações ({it.preenchidas}/{it.qty}) — {suggestCartela(b, it.pos)}
                            </div>
                            <ol className="list-decimal pl-5 text-sm leading-6 whitespace-pre-wrap">
                              {it.textos.map((t, i) => (
                                <li key={i}>{`${i + 1}# `}{t && t.trim().length ? t : 'SEM IDENTIFICAÇÃO'}</li>
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
                *A cartela é produzida completa. “Sem identificação” vai em branco.
              </div>
              <div className="text-xl font-semibold">Total: {currency(total)}</div>
            </div>
          </>
        )}
      </section>

      <div className="flex justify-end">
        <FinalizarOrcamento itens={items as any} total={total} />
      </div>
    </main>
  );
}
