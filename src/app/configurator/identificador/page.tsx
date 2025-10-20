'use client';

import React, { useEffect, useMemo, useState } from 'react';
import IdentifierPicker, {
  IdentifierType,
  MarkerColor,
  AVAILABLE_COLORS_BY_ID,
  ID_LABEL_BY_ID,
} from '@/components/IdentifierPicker';
import GaugePicker from '@/components/GaugePicker';
import FinalizarOrcamento from '@/components/FinalizarOrcamento';

/* ===================== CONFIGURÁVEIS (MÃO DE OBRA) ===================== */
// Preço/hora de mão de obra (venda)
const HORA_MO = 120; // R$/h
// Tempo por identificador (somente identificação nesta página)
const T_IDENTIFICADOR_SEG = 16; // segundos por unidade

/* ===================== PREÇOS (mesmo esquema do configurador de cabos) ===================== */
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

const COLOR_LABEL: Record<MarkerColor, string> = {
  branco: 'Branco',
  amarelo: 'Amarelo',
  cinza: 'Cinza',
  verde: 'Verde',
  transparente: 'Transparente',
};

type CartItem = {
  id: string;
  type: IdentifierType;
  color: MarkerColor;
  bitola: number;
  qty: number;
  texts: string[];
  unitPrice: number;   // TOTAL unitário (materiais + MO)
  subtotal: number;
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MarcacaoDeFiosPage() {
  /* -------------------- estado principal -------------------- */
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // etapa 1
  const [type, setType] = useState<IdentifierType>('luva');
  const [bitola, setBitola] = useState<number>(1.5);
  const [color, setColor] = useState<MarkerColor>('branco');

  // etapa 2
  const [qty, setQty] = useState<number>(10);

  // etapa 3
  const [texts, setTexts] = useState<string[]>(Array.from({ length: qty }, () => ''));

  // itens do orçamento
  const [items, setItems] = useState<CartItem[]>([]);

  /* quando mudar tipo -> ajustar cor padrão válida para esse tipo */
  useEffect(() => {
    const allowed = AVAILABLE_COLORS_BY_ID[type] ?? [];
    if (allowed.length > 0) {
      if (!allowed.includes(color)) setColor(allowed[0]);
    } else {
      // se para este tipo não há paleta, mantemos cor atual
    }
  }, [type]); // eslint-disable-line

  /* quando mudar qty -> sincroniza quantidade de caixas de texto */
  useEffect(() => {
    setTexts((prev) => {
      const next = [...prev];
      if (qty > prev.length) {
        next.push(...Array.from({ length: qty - prev.length }, () => ''));
      } else if (qty < prev.length) {
        next.length = qty;
      }
      return next;
    });
  }, [qty]);

  /* -------------------- preços -------------------- */
  // Materiais por unidade (tabela)
  const materialUnit = useMemo(() => {
    const table = PRECO_IDENT[type] ?? {};
    const val = (table as any)[bitola] ?? 0;
    return Number(val || 0);
  }, [type, bitola]);

  // Mão de obra por unidade (HORA_MO -> R$/segundo * 16s)
  const laborUnit = useMemo(() => {
    const rps = HORA_MO / 3600; // R$/seg
    return Number((rps * T_IDENTIFICADOR_SEG).toFixed(4));
  }, []);

  // Total unitário (materiais + MO)
  const unitPrice = useMemo(() => Number((materialUnit + laborUnit).toFixed(2)), [materialUnit, laborUnit]);

  const subtotalPreview = useMemo(() => Number((unitPrice * qty).toFixed(2)), [unitPrice, qty]);

  /* -------------------- navegação/validações -------------------- */
  const canNext =
    (step === 1 && !!type && !!bitola && !!color) ||
    (step === 2 && qty > 0) ||
    (step === 3 && texts.every((t) => t.trim().length > 0));

  const goNext = () => { if (canNext) setStep((s) => (Math.min(3, (s + 1)) as 1 | 2 | 3)); };
  const goBack = () => setStep((s) => (Math.max(1, (s - 1)) as 1 | 2 | 3));

  /* -------------------- adicionar ao orçamento -------------------- */
  function addToCart() {
    if (!canNext || step !== 3) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      type,
      color,
      bitola,
      qty,
      texts: texts.map((t) => t.trim().toUpperCase()),
      unitPrice, // já com materiais + MO
      subtotal: Number((unitPrice * qty).toFixed(2)),
    };
    setItems((prev) => [...prev, item]);

    // reset leve para novo lançamento
    setStep(1);
    setQty(10);
    setTexts(Array.from({ length: 10 }, () => ''));
  }

  const total = items.reduce((s, it) => s + it.subtotal, 0);

  const STEP_HELP: Record<number, React.ReactNode> = {
    1: <>Passo 1: Escolha a <b>IDENTIFICAÇÃO</b> (luva, termorretrátil, clip), <b>COR</b> e para qual <b>BITOLA</b> de fio.</>,
    2: <>Passo 2: Defina a <b>QUANTIDADE</b> de identificador.</>,
    3: <>Passo 3: Informe a <b>LEGENDA</b> dos identificadores e adicione no orçamento.</>,
  };

  /* ===================== UI ===================== */
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Marcação de Identificadores</h1>

      {/* Navegação passos */}
      <div className="flex items-center justify-between bg-white border rounded p-3">
        <div>Passo <b>{step}</b> de 3</div>
        <div className="space-x-2">
          <button onClick={goBack} disabled={step === 1}
            className={`px-3 py-1 rounded border ${step===1?'opacity-50':'hover:bg-gray-50'}`}>Voltar</button>
          {step < 3 ? (
            <button onClick={goNext} disabled={!canNext}
              className={`px-3 py-1 rounded ${canNext?'bg-blue-600 text-white':'bg-gray-300 text-gray-600'}`}>
              Próximo
            </button>
          ) : (
            <button onClick={addToCart} disabled={!canNext}
              className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50">
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


      {/* PASSO 1 – tipo + cor + bitola */}
      {step === 1 && (
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <IdentifierPicker
              title="Tipo de identificador"
              value={type}
              onChange={setType}
              selectedColor={color}
              onColorChange={setColor}
              // Paleta controlada pelo próprio componente
            />
            <div className="text-sm text-gray-600">
              Cor selecionada: <b>{COLOR_LABEL[color] ?? color}</b>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border p-4 space-y-2">
              <GaugePicker value={bitola} onChange={setBitola} />
            </div>
          </div>
        </section>
      )}

      {/* PASSO 2 – quantidade */}
      {step === 2 && (
        <section className="space-y-3">
          <div className="text-lg font-semibold">Quantidade</div>
          <input
            type="number"
            min={1}
            className="border rounded p-2 w-40"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
          />
          <div className="text-sm text-gray-600">
            Subtotal estimado: <b>{formatBRL(subtotalPreview)}</b>
          </div>
        </section>
      )}

      {/* PASSO 3 – N caixas de texto */}
      {step === 3 && (
        <section className="space-y-4">
          <div className="text-lg font-semibold">Textos para impressão ({qty})</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {texts.map((val, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-[11px] text-gray-600">Texto #{idx + 1}</div>
                <input
                  type="text"
                  maxLength={24}
                  className="border rounded p-2 w-full text-sm"
                  placeholder="EX.: S2-21.1"
                  value={val}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setTexts((t) => {
                      const next = [...t];
                      next[idx] = v;
                      return next;
                    });
                  }}
                />
                <div className="text-[11px] text-gray-500">Máx. 8 caracteres</div>
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Preço unitário: <b>{formatBRL(unitPrice)}</b> — Subtotal: <b>{formatBRL(unitPrice * qty)}</b>
          </div>
          <div>
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

      {/* ====== GRADE / TABELA — vira o PDF ====== */}
      <div id="orcamento" className="bg-white border rounded p-4">
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
                    <th className="py-2 pr-4">Qtd</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Cor</th>
                    <th className="py-2 pr-4">Bitola</th>
                    <th className="py-2 pr-4">Textos</th>
                    <th className="py-2 pr-4">Unitário</th>
                    <th className="py-2 pr-4">Subtotal</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b">
                      <td className="py-2 pr-4">{it.qty}</td>
                      <td className="py-2 pr-4">{ID_LABEL_BY_ID[it.type] ?? it.type}</td>
                      <td className="py-2 pr-4">{COLOR_LABEL[it.color] ?? it.color}</td>
                      <td className="py-2 pr-4">{it.bitola} mm²</td>
                      <td className="py-2 pr-4">{it.texts.join(', ')}</td>
                      <td className="py-2 pr-4">{formatBRL(it.unitPrice)}</td>
                      <td className="py-2 pr-4">{formatBRL(it.subtotal)}</td>
                      <td className="py-2 pr-4">
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
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
              <button className="text-sm text-gray-600 hover:underline" onClick={() => setItems([])}>
                Limpar orçamento
              </button>
              <div className="text-xl font-semibold">Total: {formatBRL(total)}</div>
            </div>
          </>
        )}
      </div>

      {/* Envio do PDF por e-mail (reaproveita a mesma lógica do outro orçamento) */}
      <div className="flex justify-end">
        <FinalizarOrcamento itens={items as any} total={total} />
      </div>
    </main>
  );
}
