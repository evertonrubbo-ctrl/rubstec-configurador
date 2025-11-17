'use client';

import React, { useMemo, useState } from 'react';
import FinalizarOrcamento from '@/components/FinalizarOrcamento';

type TipoCanaleta = 'canaleta_pvc';

type TamanhoCanaleta = '30x50' | '50x50' | '20x20' | '30x80' | '50x80' | '80x80' | '110x80';

const TIPOS_CANALETA: {
  value: TipoCanaleta;
  label: string;
  image: string;
  description: string;
}[] = [
  {
    value: 'canaleta_pvc',
    label: 'Canaleta PVC com Tampa',
    image: '/canaletas/canaleta-pvc.png',
    description: 'Canaleta branca com tampa, ideal para organização de cabos em painéis.',
  },
];

const TAMANHOS_CANALETA: { value: TamanhoCanaleta; label: string }[] = [
  { value: '30x50', label: '30 x 50 mm' },
  { value: '50x50', label: '50 x 50 mm' },
  { value: '20x20', label: '20 x 20 mm' },
  { value: '30x80', label: '30 x 80 mm' },
  { value: '50x80', label: '50 x 80 mm' },
  { value: '80x80', label: '80 x 80 mm' },
  { value: '110x80', label: '110 x 80 mm' }, 
];

/* ===================== CONFIGURÁVEIS ===================== */

// espessura (largura) da serra em mm – AJUSTE AQUI SE PRECISAR
const ESPESSURA_SERRA_MM = 3;

// tamanho padrão da barra de canaleta (em mm) – ajuste se usar 3 m, por exemplo
const TAMANHO_BARRA_MM = 2000; // 2 m

// preço de CADA BARRA completa por tamanho – AJUSTE AQUI
const PRECO_BARRA_CANALETA: Partial<Record<TamanhoCanaleta, number>> = {
  '30x50': 26.8,
  '50x50': 40.73,
  '20x20': 18.99,
  '30x80': 53.55,
  '50x80': 59.99,
  '80x80': 83.39, 
  '110x80': 100.33,    
};

type Corte45Option = 'nenhum' | 'esquerdo' | 'direito' | 'ambos';

type LinhaCorte = {
  id: string;
  descricao: string;
  comprimento: number; // em mm
  quantidade: number;
  corte45: Corte45Option;
};

type ItemOrcamento = {
  id: string;
  descricao: string;
  quantidade: number;
  unitario: number;
  subtotal: number;
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function labelCorte45(c: Corte45Option): string {
  switch (c) {
    case 'esquerdo':
      return '45° lado esquerdo';
    case 'direito':
      return '45° lado direito';
    case 'ambos':
      return '45° nos dois lados';
    default:
      return 'Sem corte 45°';
  }
}

export default function CorteCanaletaPage() {
  const [tipoCanaleta, setTipoCanaleta] = useState<TipoCanaleta | ''>('');
  const [tamanhoCanaleta, setTamanhoCanaleta] = useState<TamanhoCanaleta | ''>('');
  const [descricao, setDescricao] = useState('');
  const [comprimento, setComprimento] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState<number | ''>('');
  const [corte45Sel, setCorte45Sel] = useState<Corte45Option>('nenhum');
  const [linhas, setLinhas] = useState<LinhaCorte[]>([]);

  /* ------------- adicionar / remover linhas digitadas ------------- */
  function addLinha() {
    if (!tipoCanaleta) {
      alert('Selecione o tipo de canaleta antes de adicionar.');
      return;
    }
    if (!tamanhoCanaleta) {
      alert('Selecione o tamanho da canaleta antes de adicionar.');
      return;
    }

    const comp = Number(comprimento);
    const qtd = Number(quantidade);

    if (!comp || comp <= 0) {
      alert('Informe um comprimento válido (mm).');
      return;
    }
    if (!qtd || qtd <= 0) {
      alert('Informe uma quantidade válida.');
      return;
    }
    if (comp > TAMANHO_BARRA_MM) {
      alert(
        `O comprimento informado (${comp} mm) é maior que o tamanho da barra (${TAMANHO_BARRA_MM} mm).`
      );
      return;
    }

    setLinhas((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        descricao: descricao.trim(),
        comprimento: comp,
        quantidade: qtd,
        corte45: corte45Sel,
      },
    ]);

    setDescricao('');
    setComprimento('');
    setQuantidade('');
    setCorte45Sel('nenhum');
  }

  function removerLinha(id: string) {
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  }

  function limparLinhas() {
    setLinhas([]);
  }

  /* ------------- OTIMIZAÇÃO DE BARRAS ------------- */
  // "explode" as linhas em uma lista de cortes individuais
  const cortesIndividuais = useMemo(() => {
    const arr: number[] = [];
    linhas.forEach((l) => {
      for (let i = 0; i < l.quantidade; i++) {
        arr.push(l.comprimento);
      }
    });
    return arr;
  }, [linhas]);

  // algoritmo guloso: tenta encaixar o maior corte na primeira barra com espaço
  // já considerando a perda da serra em CADA peça
  const barrasOtimizadas: number[][] = useMemo(() => {
    if (!cortesIndividuais.length) return [];

    const ordenados = [...cortesIndividuais].sort((a, b) => b - a);
    const barrasRestante: number[] = []; // quanto ainda cabe em cada barra
    const barrasCortes: number[][] = [];

    ordenados.forEach((corte) => {
      // cada peça consome o comprimento dela + 1 corte de serra
      const consumo = corte + ESPESSURA_SERRA_MM;

      // procura uma barra onde ainda caiba esse consumo
      let pos = barrasRestante.findIndex((restante) => restante >= consumo);

      if (pos === -1) {
        // abre nova barra
        barrasRestante.push(TAMANHO_BARRA_MM - consumo);
        barrasCortes.push([corte]);
      } else {
        // usa barra existente
        barrasRestante[pos] -= consumo;
        barrasCortes[pos].push(corte);
      }
    });

    return barrasCortes;
  }, [cortesIndividuais]);

  const qtdBarras = barrasOtimizadas.length;
  const precoBarra =
    tamanhoCanaleta && PRECO_BARRA_CANALETA[tamanhoCanaleta]
      ? PRECO_BARRA_CANALETA[tamanhoCanaleta]!
      : 0;
  const total = qtdBarras * precoBarra;

  /* ------------- ITENS PARA ENVIAR PARA O FinalizarOrcamento ------------- */
  const itensOrcamento: ItemOrcamento[] = useMemo(() => {
    if (!tipoCanaleta || !tamanhoCanaleta || !qtdBarras) return [];

    const labelTipo =
      TIPOS_CANALETA.find((t) => t.value === tipoCanaleta)?.label || 'Canaleta';
    const labelTam =
      TAMANHOS_CANALETA.find((t) => t.value === tamanhoCanaleta)?.label || '';

    return [
      {
        id: 'canaleta',
        descricao: `${labelTipo} ${labelTam} – barras ${TAMANHO_BARRA_MM / 1000} m`,
        quantidade: qtdBarras,
        unitario: precoBarra,
        subtotal: total,
      },
    ];
  }, [tipoCanaleta, tamanhoCanaleta, qtdBarras, precoBarra, total]);

  const labelCanaletaSelecionada =
    tipoCanaleta && TIPOS_CANALETA.find((t) => t.value === tipoCanaleta)?.label;
  const labelTamanhoSelecionado =
    tamanhoCanaleta && TAMANHOS_CANALETA.find((t) => t.value === tamanhoCanaleta)?.label;

  const totalSolicitadoMm = linhas.reduce(
    (acc, l) => acc + l.comprimento * l.quantidade,
    0
  );

  // total de cortes (peças) e perda total da serra (informativo)
  const totalCortes = cortesIndividuais.length;
  const perdaTotalSerra = totalCortes * ESPESSURA_SERRA_MM;

  /* ===================== UI ===================== */
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Corte de Canaleta Sob Medida</h1>
      <p className="text-sm text-gray-600">
        Informe o tipo de canaleta, o tamanho, os comprimentos desejados e, se necessário,
        marque quais peças terão corte em 45° em cada lado. O sistema calcula a quantidade
        de barras e gera o orçamento automaticamente, já considerando a perda da serra.
      </p>

      {/* FORM PRINCIPAL */}
      <section className="bg-white border rounded p-4 space-y-4">
        {/* Tipo de canaleta – seleção em cards com imagem */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de canaleta</label>

          <div className="grid gap-3 md:grid-cols-3">
            {TIPOS_CANALETA.map((t) => {
              const selected = tipoCanaleta === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipoCanaleta(t.value)}
                  className={[
                    'flex flex-col items-stretch rounded-xl border bg-white text-left transition',
                    'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                    selected ? 'border-blue-600 ring-2 ring-blue-500' : 'border-gray-300',
                  ].join(' ')}
                >
                  <div className="w-full h-28 border-b bg-gray-50 rounded-t-xl overflow-hidden flex items-center justify-center">
                    <img
                      src={t.image}
                      alt={t.label}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-xs text-gray-500">{t.description}</div>
                    {selected && (
                      <div className="mt-1 inline-flex items-center text-[11px] font-medium text-blue-600">
                        Selecionado
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tamanho da canaleta */}
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Tamanho da canaleta</label>
            <select
              className="border rounded p-2 w-full text-sm"
              value={tamanhoCanaleta}
              onChange={(e) => setTamanhoCanaleta(e.target.value as TamanhoCanaleta)}
            >
              <option value="">Selecione...</option>
              {TAMANHOS_CANALETA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 text-xs text-gray-500">
            As barras possuem {TAMANHO_BARRA_MM / 1000} m de comprimento.
            Cada corte possui uma perda aproximada de {ESPESSURA_SERRA_MM} mm por corte.
          </div>
        </div>

        {/* Linha para digitar peça */}
        <div className="grid md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Descrição (opcional)
            </label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              placeholder="Ex.: Canaleta superior painel A"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comprimento (mm)</label>
            <input
              type="number"
              className="border rounded p-2 w-full"
              placeholder="Ex.: 750"
              value={comprimento}
              onChange={(e) => setComprimento(Number(e.target.value) || '')}
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantidade</label>
            <input
              type="number"
              className="border rounded p-2 w-full"
              placeholder="Ex.: 4"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value) || '')}
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Corte em 45°</label>
            <select
              className="border rounded p-2 w-full text-sm"
              value={corte45Sel}
              onChange={(e) => setCorte45Sel(e.target.value as Corte45Option)}
            >
              <option value="nenhum">Sem corte 45°</option>
              <option value="esquerdo">Lado esquerdo</option>
              <option value="direito">Lado direito</option>
              <option value="ambos">Ambos os lados</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={addLinha}
          className="mt-2 inline-flex items-center px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
        >
          Adicionar à lista
        </button>
      </section>

      {/* LISTA DE PEÇAS DIGITADAS */}
      <section className="bg-white border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Peças da canaleta</h2>
          {linhas.length > 0 && (
            <button
              onClick={limparLinhas}
              className="text-sm text-gray-600 hover:underline"
            >
              Limpar lista
            </button>
          )}
        </div>

        {linhas.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma peça adicionada ainda. Informe descrição, comprimento, quantidade
            e corte em 45° (se necessário), e clique em &quot;Adicionar à lista&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Descrição</th>
                  <th className="py-2 pr-4">Comprimento (mm)</th>
                  <th className="py-2 pr-4">Quantidade</th>
                  <th className="py-2 pr-4">Total (mm)</th>
                  <th className="py-2 pr-4">Corte 45°</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-2 pr-4">
                      {l.descricao || (
                        <span className="text-gray-400">(sem descrição)</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{l.comprimento}</td>
                    <td className="py-2 pr-4">{l.quantidade}</td>
                    <td className="py-2 pr-4">
                      {l.comprimento * l.quantidade}
                    </td>
                    <td className="py-2 pr-4">{labelCorte45(l.corte45)}</td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => removerLinha(l.id)}
                        className="text-red-600 text-xs hover:underline"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ORÇAMENTO + OTIMIZAÇÃO */}
      <section id="orcamento" className="bg-white border rounded p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Resumo do orçamento</h2>
          <div className="text-sm text-gray-600">
            {labelCanaletaSelecionada && <span>{labelCanaletaSelecionada}</span>}
            {labelTamanhoSelecionado && (
              <span className="ml-2 text-gray-500">• {labelTamanhoSelecionado}</span>
            )}
          </div>
        </div>

        {(!tipoCanaleta || !tamanhoCanaleta || linhas.length === 0 || !qtdBarras) ? (
          <p className="text-sm text-gray-500">
            Para gerar o orçamento, selecione o tipo e o tamanho da canaleta e adicione
            pelo menos uma peça na lista.
          </p>
        ) : (
          <>
            {/* Resumo numérico */}
            <div className="space-y-1 text-sm">
              <p>
                <b>Tamanho da barra considerada:</b> {TAMANHO_BARRA_MM / 1000} m
              </p>
              <p>
                <b>Total de comprimento solicitado:</b> {totalSolicitadoMm} mm
              </p>
              <p>
                <b>Total de cortes (peças):</b> {totalCortes}{' '}
                <span className="text-gray-500">
                  (perda estimada da serra: {perdaTotalSerra} mm)
                </span>
              </p>
              <p>
                <b>Quantidade de barras necessárias:</b> {qtdBarras}
              </p>
              <p>
                <b>Preço unitário da barra:</b> {formatBRL(precoBarra)}
              </p>
              <p className="text-base">
                <b>Total das canaletas:</b> {formatBRL(total)}
              </p>
            </div>

            {/* Otimização das barras */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                Otimização dos cortes por barra
              </h3>
              {barrasOtimizadas.map((cortes, idx) => {
                const somaCortes = cortes.reduce((acc, c) => acc + c, 0);
                const numeroDeCortes = cortes.length;
                const perdaSerraBarra = numeroDeCortes * ESPESSURA_SERRA_MM;

                let sobra = TAMANHO_BARRA_MM - (somaCortes + perdaSerraBarra);
                if (sobra < 0) sobra = 0;

                return (
                  <div
                    key={idx}
                    className="text-xs bg-gray-50 border rounded p-2 cortes-card"
                  >
                    <div className="font-semibold mb-1">
                      Barra {idx + 1}
                    </div>
                    <div className="cortes-line">
                      Cortes: {cortes.join(' mm, ')} mm
                    </div>
                    <div>
                      Sobra: {sobra} mm{' '}
                      <span className="text-gray-400">
                        (perda serra: {perdaSerraBarra} mm)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Envio / finalização – mesmo componente dos outros serviços */}
      <div className="flex justify-end">
        <FinalizarOrcamento itens={itensOrcamento as any} total={total} />
      </div>
    </main>
  );
}
