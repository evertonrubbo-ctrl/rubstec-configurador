// src/app/api/send/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1) Config SMTP: usa ENV se existir; senão, usa os valores fixos abaixo
const SMTP = {
  host: (process.env.SMTP_HOST || 'smtp.hostinger.com').trim(),
  port: Number((process.env.SMTP_PORT || '587').trim()),
  secure: String(process.env.SMTP_SECURE ?? 'false').trim() === 'true', // 465=>true, 587=>false
  user: (process.env.SMTP_USER || 'rubstec@rubstec.com.br').trim(),
  pass: (process.env.SMTP_PASS || 'Rubstec@12345').trim(),            // <<< TROQUE AQUI
  toRub: (process.env.NEXT_PUBLIC_RUBSTEC_EMAIL || 'rubstec@rubstec.com.br').trim(),
};

function makeTransport(nodemailer: any, authMethod: 'LOGIN' | 'PLAIN') {
  const { host, port, secure, user, pass } = SMTP;

  if (!host || !user || !pass) {
    throw new Error(
      `SMTP config incompleta (host/user/pass). host="${host}", user="${user.length ? '***' : ''}"`
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    authMethod,
    requireTLS: !secure,          // força STARTTLS no 587
    tls: { ciphers: 'TLSv1.2' },
  });
}

export async function POST(req: Request) {
  try {
    const nodemailer: any = await import('nodemailer');

    // 2) Lê o form
    const form = await req.formData();
    const nome         = String(form.get('cliente_nome')     || '');
    const emailCliente = String(form.get('cliente_email')    || '');
    const telefone     = String(form.get('cliente_telefone') || '');
    const total        = String(form.get('total')            || '');

    const file = form.get('attachment') as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: 'Missing PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3) Tenta autenticar com LOGIN; se falhar, tenta PLAIN
    let transporter;
    try {
      transporter = makeTransport(nodemailer, 'LOGIN');
      await transporter.verify();
    } catch (e1) {
      // fallback
      transporter = makeTransport(nodemailer, 'PLAIN');
      await transporter.verify();
    }

    const to = [SMTP.toRub, emailCliente].filter(Boolean).join(',');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827">
        <h2 style="margin:0 0 8px">RUBSTEC • Confirmação de Orçamento</h2>
        <p>Olá <b>${nome}</b>, recebemos seu orçamento. A equipe Rubstec agradece a preferência!</p>
        <p>Em breve retornaremos com frete, prazo e disponibilidade. O PDF segue em anexo.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p><b>Total estimado:</b> R$ ${total}</p>
        <p><b>Contato:</b> ${emailCliente} • ${telefone || '-'}</p>
        <p style="color:#6b7280;font-size:12px">Mensagem automática do configurador Rubstec.</p>
      </div>
    `.trim();

    await transporter.sendMail({
      from: `"Rubstec" <${SMTP.user}>`, // remetente deve ser o usuário SMTP
      to,
      subject: `Seu orçamento foi recebido – ${nome}`,
      html,
      attachments: [
        { filename: 'orcamento-rubstec.pdf', content: buffer, contentType: 'application/pdf' },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Evita vazar senha/credenciais nos logs
    const msg =
      err?.response ||
      err?.message ||
      'smtp_error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
