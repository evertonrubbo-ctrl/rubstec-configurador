'use client';

import React, { useMemo, useRef, useState } from 'react';


export type OrcItem = {
  id: string;
  metragem: number;
  bitola: number;
  cor: string;
  termA: string;
  termB: string;
  termAHole: number | null;
  termBHole: number | null;
  qty: number;
  unitPrice: number;
  subtotal: number;
  identifierTypeA: string | 'none';
  identifierTextA: string | null;
  identifierTypeB: string | 'none';
  identifierTextB: string | null;
  markerColorA: string | null;
  markerColorB: string | null;
};

type Props = {
  itens: OrcItem[];
  total: number;
  rubstecEmail?: string;
};

export default function FinalizarOrcamento({
  itens,
  total,
  rubstecEmail = process.env.NEXT_PUBLIC_RUBSTEC_EMAIL || 'rubstec@rubstec.com.br',
}: Props) {
  const [open, setOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const dummyFormRef = useRef<HTMLFormElement>(null); // só para reaproveitar input[file]

  const totalFmt = useMemo(() => total.toFixed(2), [total]);

  /** Gera PDF do #orcamento usando html2pdf bundle (sem EmailJS) */
  async function gerarPdfBlob(): Promise<Blob> {
    const alvo = document.getElementById('orcamento');
    if (!alvo) throw new Error('Elemento #orcamento não encontrado na página.');

    const { default: html2pdf } = await import('html2pdf.js/dist/html2pdf.bundle.min.js');

    const style = document.createElement('style');
    style.textContent = `
      #orcamento, #orcamento * {
        color: #111827 !important;
        background: #ffffff !important;
        border-color: #e5e7eb !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `orcamento-rubstec-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.9 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const },
    };

    try {
      const worker = (html2pdf as any)().from(alvo).set(opt).toPdf();
      const pdf: any = await worker.get('pdf');
      const blob: Blob = pdf.output('blob');
      return blob;
    } finally {
      style.remove();
    }
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();

    if (!nome || !email) {
      alert('Informe pelo menos Nome e E-mail.');
      return;
    }

    try {
      setEnviando(true);

      const pdfBlob = await gerarPdfBlob();
      const pdfFile = new File([pdfBlob], 'orcamento-rubstec.pdf', {
        type: 'application/pdf',
      });

      const fd = new FormData();
      fd.append('cliente_nome', nome);
      fd.append('cliente_email', email);
      fd.append('cliente_telefone', telefone || '-');
      fd.append('total', totalFmt);
      fd.append('attachment', pdfFile);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);

      const resp = await fetch('/api/send', {
        method: 'POST',
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timer);

      let data: any = null;
      try {
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          data = await resp.json();
        } else {
          const text = await resp.text();
          data = { ok: false, error: text?.slice(0, 400) || 'Resposta não-JSON da API' };
        }
      } catch {
        data = { ok: false, error: 'Falha ao interpretar a resposta da API' };
      }

      if (!resp.ok || !data?.ok) {
        console.error('SMTP resp', { status: resp.status, data });
        throw new Error(data?.error || `Falha HTTP ${resp.status}`);
      }

      setOpen(false);
      alert('Orçamento enviado com sucesso! Logo a Equipe Rubstec entrará em contato!');
    } catch (err: any) {
      console.error('Send error:', err);
      const msg =
        err?.name === 'AbortError'
          ? 'Tempo de conexão esgotado. Tente novamente em instantes.'
          : err?.message || 'Falha ao enviar o orçamento.';
      alert(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 shadow"
        onClick={() => setOpen(true)}
      >
        Finalizar Orçamento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-lg font-semibold mb-2">Enviar orçamento por e-mail</div>
            <p className="text-sm text-gray-600 mb-4">
              Preencha seus dados para receber o PDF. Uma cópia será enviada à Rubstec.
            </p>

            <form className="space-y-3" onSubmit={handleEnviar}>
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <input
                  className="w-full border rounded p-2"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="text-sm font-medium">E-mail *</label>
                <input
                  type="email"
                  className="w-full border rounded p-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seuemail@exemplo.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Telefone (opcional)</label>
                <input
                  className="w-full border rounded p-2"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(54) 9 9999-9999"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded border"
                  onClick={() => setOpen(false)}
                  disabled={enviando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
                  disabled={enviando}
                >
                  {enviando ? 'Enviando…' : 'Enviar orçamento'}
                </button>
              </div>
            </form>

            {/* form “fantasma” só se você quiser reaproveitar um input[file]; não é necessário aqui */}
            <form ref={dummyFormRef} className="hidden"><input type="file" /></form>
          </div>
        </div>
      )}
    </>
  );
}
