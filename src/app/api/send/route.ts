// src/app/api/send/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================
   Tipos mínimos (sem @types)
   ========================= */
type AuthMethod = 'LOGIN' | 'PLAIN';

type SmtpOpts = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  authMethod?: AuthMethod;
};

type Transporter = {
  verify(): Promise<void>;
  sendMail: (opts: {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments: { filename: string; content: Buffer; contentType: string }[];
  }) => Promise<unknown>;
};

type NodemailerNS = {
  createTransport: (opts: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
    authMethod?: AuthMethod;
    requireTLS?: boolean;
    tls?: { ciphers?: string };
    logger?: boolean;
    debug?: boolean;
  }) => Transporter;
};

/* Cria e verifica um transporter com o método de auth indicado */
async function makeTransport(
  nodemailer: NodemailerNS,
  opts: SmtpOpts & { authMethod: AuthMethod }
): Promise<Transporter> {
  const { host, port, secure, user, pass, authMethod } = opts;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    authMethod,
    requireTLS: !secure, // força STARTTLS quando não for 465
    tls: { ciphers: 'TLSv1.2' },
    logger: true,
    debug: true,
  });

  // se falhar aqui, cai no catch de quem chamou
  await transporter.verify();
  return transporter;
}

export async function POST(req: Request) {
  try {
    // import dinâmico p/ evitar problemas em build edge
    const nodemailer: NodemailerNS = (await import('nodemailer')) as unknown as NodemailerNS;

    // ---- FormData
    const form = await req.formData();
    const nome         = String(form.get('cliente_nome')     ?? '').trim();
    const emailCliente = String(form.get('cliente_email')    ?? '').trim();
    const telefone     = String(form.get('cliente_telefone') ?? '').trim();
    const total        = String(form.get('total')            ?? '').trim();

    const file = form.get('attachment') as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: 'Missing PDF' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ---- ENV (lembre de configurar também na Vercel: Settings > Environment Variables)
    const host   = (process.env.SMTP_HOST ?? '').trim();
    const port   = Number((process.env.SMTP_PORT ?? '587').trim());
    const secure = String(process.env.SMTP_SECURE ?? 'false').trim() === 'true'; // 465 => true
    const user   = (process.env.SMTP_USER ?? '').trim();
    const pass   = (process.env.SMTP_PASS ?? '').trim();
    const toRub  = (process.env.NEXT_PUBLIC_RUBSTEC_EMAIL ?? 'rubstec@rubstec.com.br').trim();

    if (!host || !user || !pass) {
      return NextResponse.json(
        { ok: false, error: 'SMTP env missing (HOST/USER/PASS)' },
        { status: 500 }
      );
    }

    // ---- Cria transporter: tenta LOGIN, cai para PLAIN se falhar
    let transporter: Transporter;
    try {
      transporter = await makeTransport(nodemailer, {
        host, port, secure, user, pass, authMethod: 'LOGIN',
      });
      console.log('[SMTP] verify OK com AUTH LOGIN');
    } catch (eLogin: any) {
      console.warn('[SMTP] LOGIN falhou, tentando PLAIN…', eLogin?.code ?? eLogin?.message);
      transporter = await makeTransport(nodemailer, {
        host, port, secure, user, pass, authMethod: 'PLAIN',
      });
      console.log('[SMTP] verify OK com AUTH PLAIN');
    }

    // ---- Monta e envia
    const to = [toRub, emailCliente].filter(Boolean).join(',');
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827">
        <h2 style="margin:0 0 8px">RUBSTEC • Confirmação de Orçamento</h2>
        <p>Olá <b>${nome || 'Cliente'}</b>, recebemos seu orçamento. A equipe Rubstec agradece a preferência!</p>
        <p>Em breve retornaremos com frete, prazo e disponibilidade. O PDF segue em anexo.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p><b>Total estimado:</b> R$ ${total || '-'}</p>
        <p><b>Contato:</b> ${emailCliente || '-'} • ${telefone || '-'}</p>
        <p style="color:#6b7280;font-size:12px">Mensagem automática do configurador Rubstec.</p>
      </div>
    `.trim();

    await transporter.sendMail({
      from: `"Rubstec" <${user}>`, // remetente deve casar com o usuário SMTP
      to,
      subject: `Seu orçamento foi recebido – ${nome || 'Cliente'}`,
      html,
      attachments: [
        { filename: 'orcamento-rubstec.pdf', content: buffer, contentType: 'application/pdf' },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // mensagens úteis sem vazar segredos
    const msg =
      err?.response?.toString?.() ||
      err?.message ||
      err?.code ||
      'smtp_error';

    console.error('SMTP error:', { msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
