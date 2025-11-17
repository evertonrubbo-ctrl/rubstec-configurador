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
  const dummyFormRef = useRef<HTMLFormElement>(null);

  const totalFmt = useMemo(() => total.toFixed(2), [total]);

  /**
   * Gera PDF do #orcamento usando html2canvas + jsPDF
   * ajustando a escala para caber 100% em 1 página A4.
   */
  async function gerarPdfBlob(): Promise<Blob> {
    const alvo = document.getElementById('orcamento');
    if (!alvo) throw new Error('Elemento #orcamento não encontrado na página.');

    // Força visual "limpo" no PDF
    const style = document.createElement('style');
    style.textContent = `
      #orcamento, #orcamento * {
        color: #111827 !important;
        background: #ffffff !important;
        border-color: #e5e7eb !important;
        box-shadow: none !important;
      }

      /* aumenta o "respiro" das linhas de cortes só no PDF */
      #orcamento .cortes-card,
      #orcamento .cortes-card * {
        line-height: 1.4 !important;
      }

      #orcamento .cortes-line {
        padding-top: 2px !important;
        padding-bottom: 2px !important;
        display: block !important;
      }
    `;
    document.head.appendChild(style);


    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(alvo, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL('image/png');

      // PDF A4 em retrato (portrait). Se quiser landscape, troque aqui.
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Margens de 5mm
      const marginX = 5;
      const marginY = 5;
      const maxWidth = pageWidth - marginX * 2;
      const maxHeight = pageHeight - marginY * 2;

      // Tamanho da imagem em mm se usássemos largura cheia
      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Se ainda ficar mais alto que a página, reduz a escala
      if (imgHeight > maxHeight) {
        const scale = maxHeight / imgHeight;
        imgWidth *= scale;
        imgHeight *= scale;
      }

      // Centraliza dentro da página com margens
      const posX = (pageWidth - imgWidth) / 2;
      const posY = marginY; // pode usar (pageHeight - imgHeight)/2 se quiser centralizar vertical

      pdf.addImage(imgData, 'PNG', posX, posY, imgWidth, imgHeight);

      const blob = pdf.output('blob');
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

            <form ref={dummyFormRef} className="hidden">
              <input type="file" />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
