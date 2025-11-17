"use client";

import React, { useMemo, useState } from "react";
import FinalizarOrcamento from "@/components/FinalizarOrcamento";

type TipoTrilho =
  | "ts35_liso_zincado"
  | "ts35_perfurado_zincado"
  | "ts35_aluminio"
  | "ts15_liso"
  | "ts15_perfurado";

const TIPOS_TRILHO: {
  value: TipoTrilho;
  label: string;
  image: string;
  description: string;
}[] = [
  {
    value: "ts35_perfurado_zincado",
    label: "TS35 – Perfurado Zincado",
    image: "/trilhos/perfurado-zincado.png",
    description: "Com furos para fixação rápida de componentes.",
  },
  {
    value: "ts35_aluminio",
    label: "TS35 – Alumínio",
    image: "/trilhos/aluminio-liso.png",
    description: "Mais leve, ideal para painéis especiais.",
  },
  {
    value: "ts35_liso_zincado",
    label: "TS35 – Liso Zincado",
    image: "/trilhos/aco-zincado-liso.png",
    description: "Trilho padrão para bornes, superfície lisa zincada.",
  },
];


/* ===================== CONFIGURÁVEIS ===================== */
// tamanho padrão da barra (em mm)
const TAMANHO_BARRA_MM = 2000; // 2m

// preço de CADA BARRA completa (venda) – AJUSTE AQUI
const PRECO_BARRA: Partial<Record<TipoTrilho, number>> = {
  ts35_liso_zincado: 17, // R$ por barra de 2m
  ts35_perfurado_zincado: 16.1,
  ts35_aluminio: 19.24,
};

type LinhaCorte = {
  id: string;
  descricao: string;
  comprimento: number; // em mm
  quantidade: number;
};

type ItemOrcamento = {
  id: string;
  descricao: string;
  quantidade: number;
  unitario: number;
  subtotal: number;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CorteTrilhoTsPage() {
  const [tipoTrilho, setTipoTrilho] = useState<TipoTrilho | "">("");
  const [descricao, setDescricao] = useState("");
  const [comprimento, setComprimento] = useState<number | "">("");
  const [quantidade, setQuantidade] = useState<number | "">("");
  const [linhas, setLinhas] = useState<LinhaCorte[]>([]);

  /* ------------- adicionar / remover linhas digitadas ------------- */
  function addLinha() {
    if (!tipoTrilho) {
      alert("Selecione o tipo de trilho antes de adicionar.");
      return;
    }
    const comp = Number(comprimento);
    const qtd = Number(quantidade);

    if (!comp || comp <= 0) {
      alert("Informe um comprimento válido (mm).");
      return;
    }
    if (!qtd || qtd <= 0) {
      alert("Informe uma quantidade válida.");
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
      },
    ]);

    setDescricao("");
    setComprimento("");
    setQuantidade("");
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

  // algoritmo guloso: sempre tenta encaixar o maior corte na primeira barra com espaço
  const barrasOtimizadas: number[][] = useMemo(() => {
    if (!cortesIndividuais.length) return [];

    const ordenados = [...cortesIndividuais].sort((a, b) => b - a);
    const barrasRestante: number[] = [];
    const barrasCortes: number[][] = [];

    ordenados.forEach((corte) => {
      let pos = barrasRestante.findIndex((restante) => restante >= corte);

      if (pos === -1) {
        // abre nova barra
        barrasRestante.push(TAMANHO_BARRA_MM - corte);
        barrasCortes.push([corte]);
      } else {
        // usa barra existente
        barrasRestante[pos] -= corte;
        barrasCortes[pos].push(corte);
      }
    });

    return barrasCortes;
  }, [cortesIndividuais]);

  const qtdBarras = barrasOtimizadas.length;
  const precoBarra = tipoTrilho ? PRECO_BARRA[tipoTrilho] ?? 0 : 0;
  const total = qtdBarras * precoBarra;

  /* ------------- ITENS PARA ENVIAR PARA O FinalizarOrcamento ------------- */
  const itensOrcamento: ItemOrcamento[] = useMemo(() => {
    if (!tipoTrilho || !qtdBarras) return [];
    const label =
      TIPOS_TRILHO.find((t) => t.value === tipoTrilho)?.label || "Trilho TS";

    return [
      {
        id: "trilho",
        descricao: `${label} – barras ${TAMANHO_BARRA_MM / 1000} m`,
        quantidade: qtdBarras,
        unitario: precoBarra,
        subtotal: total,
      },
    ];
  }, [tipoTrilho, qtdBarras, precoBarra, total]);

  const labelTrilhoSelecionado =
    tipoTrilho && TIPOS_TRILHO.find((t) => t.value === tipoTrilho)?.label;

  const totalSolicitadoMm = linhas.reduce(
    (acc, l) => acc + l.comprimento * l.quantidade,
    0
  );

  /* ===================== UI ===================== */
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Corte de Trilho TS Sob Medida</h1>

      {/* FORM PRINCIPAL */}
      <section className="bg-white border rounded p-4 space-y-4">
        {/* Tipo de trilho – seleção em cards com imagem */}
        <div>
        <label className="block text-sm font-medium mb-2">
            Tipo de trilho
        </label>

        <div className="grid gap-3 md:grid-cols-3">
            {TIPOS_TRILHO.map((t) => {
            const selected = tipoTrilho === t.value;
            return (
                <button
                key={t.value}
                type="button"
                onClick={() => setTipoTrilho(t.value)}
                className={[
                    "flex flex-col items-stretch rounded-xl border bg-white text-left transition",
                    "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    selected ? "border-blue-600 ring-2 ring-blue-500" : "border-gray-300"
                ].join(" ")}
                >
                <div className="w-full h-28 border-b bg-gray-50 rounded-t-xl overflow-hidden flex items-center justify-center">
                    {/* ajuste o tamanho da imagem conforme necessário */}
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


        {/* Linha para digitar peça */}
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Descrição (opcional)
            </label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              placeholder="Ex.: Trilho para bornes lado A"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Comprimento (mm)
            </label>
            <input
              type="number"
              className="border rounded p-2 w-full"
              placeholder="Ex.: 350"
              value={comprimento}
              onChange={(e) =>
                setComprimento(Number(e.target.value) || "")
              }
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Quantidade
            </label>
            <input
              type="number"
              className="border rounded p-2 w-full"
              placeholder="Ex.: 4"
              value={quantidade}
              onChange={(e) =>
                setQuantidade(Number(e.target.value) || "")
              }
              min={1}
            />
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
          <h2 className="text-lg font-semibold">Peças do painel</h2>
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
            Nenhuma peça adicionada ainda. Informe descrição, comprimento e
            quantidade e clique em &quot;Adicionar à lista&quot;.
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
                  <th className="py-2 pr-4"></th>
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
      <section
        id="orcamento"
        className="bg-white border rounded p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Resumo do orçamento</h2>
          {labelTrilhoSelecionado && (
            <span className="text-sm text-gray-600">
              {labelTrilhoSelecionado}
            </span>
          )}
        </div>

        {(!tipoTrilho || linhas.length === 0 || !qtdBarras) ? (
          <p className="text-sm text-gray-500">
            Para gerar o orçamento, selecione um tipo de trilho e adicione
            pelo menos uma peça na lista.
          </p>
        ) : (
          <>
            {/* Resumo numérico */}
            <div className="space-y-1 text-sm">
              <p>
                <b>Tamanho da barra utilizada:</b>{" "}
                {TAMANHO_BARRA_MM / 1000} m
              </p>
              <p>
                <b>Total de comprimento solicitado:</b>{" "}
                {totalSolicitadoMm} mm
              </p>
              <p>
                <b>Quantidade de barras necessárias:</b> {qtdBarras}
              </p>
              <p>
                <b>Preço unitário da barra:</b>{" "}
                {formatBRL(precoBarra)}
              </p>
              <p className="text-base">
                <b>Total do trilho:</b> {formatBRL(total)}
              </p>
            </div>

            {/* Otimização das barras */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                Otimização dos cortes por barra
              </h3>
              {barrasOtimizadas.map((cortes, idx) => {
                const somaCortes = cortes.reduce(
                  (acc, c) => acc + c,
                  0
                );
                const sobra = TAMANHO_BARRA_MM - somaCortes;
                return (
                  <div
                    key={idx}
                    className="text-xs bg-gray-50 border rounded p-2 cortes-card"
                  >
                    <div className="font-semibold mb-1">Barra {idx + 1}</div>

                    {/* linha marcada para ajustar no PDF */}
                    <div className="cortes-line">
                      Cortes: {cortes.join(" mm, ")} mm
                    </div>

                    <div>Sobra: {sobra} mm</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Envio / finalização – usa mesmo componente dos outros serviços */}
      <div className="flex justify-end">
        <FinalizarOrcamento
          itens={itensOrcamento as any}
          total={total}
        />
      </div>
    </main>
  );
}
