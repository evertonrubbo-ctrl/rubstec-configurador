import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function makeTransport(nodemailer: any, opts: {
  host: string; port: number; secure: boolean;
  user: string; pass: string; authMethod: 'LOGIN' | 'PLAIN';
}) {
  const { host, port, secure, user, pass, authMethod } = opts;
  const transporter = nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
    authMethod,
    requireTLS: !secure,             // força STARTTLS no 587
    tls: { ciphers: 'TLSv1.2' },
    logger: true,
    debug: true,
  });
  await transporter.verify();        // dispara erro cedo se auth/conexão falhar
  return transporter;
}

export async function POST(req: Request) {
  try {
    const nodemailer: any = await import('nodemailer');

    const form = await req.formData();
    const nome         = String(form.get('cliente_nome')     || '');
    const emailCliente = String(form.get('cliente_email')    || '');
    const telefone     = String(form.get('cliente_telefone') || '');
    const total        = String(form.get('total')            || '');

    const file = form.get('attachment') as File | null;
    if (!file) return NextResponse.json({ ok: false, error: 'Missing PDF' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- ENV (ajuste no .env.local e reinicie o dev server) ---
    const host   = (process.env.SMTP_HOST || '').trim();
    const port   = Number((process.env.SMTP_PORT || '587').trim());
    const secure = String(process.env.SMTP_SECURE || 'false').trim() === 'true'; // 465 => true
    const user   = (process.env.SMTP_USER || '').trim();
    const pass   = (process.env.SMTP_PASS || '').trim();
    const toRub  = (process.env.NEXT_PUBLIC_RUBSTEC_EMAIL || 'rubstec@rubstec.com.br').trim();

    console.log('[SMTP cfg]', { host, port, secure, user, passLen: pass.length });

    // 1ª tentativa: AUTH LOGIN
    let transporter;
    try {
      transporter = await makeTransport(nodemailer, { host, port, secure, user, pass, authMethod: 'LOGIN' });
      console.log('[SMTP] verify OK com AUTH LOGIN');
    } catch (eLogin: any) {
      console.warn('[SMTP] LOGIN falhou, tentando PLAIN…', eLogin?.response || eLogin?.message);
      // 2ª tentativa: AUTH PLAIN
      transporter = await makeTransport(nodemailer, { host, port, secure, user, pass, authMethod: 'PLAIN' });
      console.log('[SMTP] verify OK com AUTH PLAIN');
    }

    const to = [toRub, emailCliente].filter(Boolean).join(',');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827">
        <h2 style="margin:0 0 8px">RUBSTEC • Confirmação de Orçamento</h2>
        <p>Olá <b>${nome}</b>, recebemos seu orçamento. A equipe Rubstec agradece a preferência!</p>
        <p>Em breve retornaremos com frete, prazo e disponibilidade. O PDF segue em anexo.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p><b>Total estimado:</b> R$ ${total}</p>
        <p><b>Contato:</b> ${emailCliente} • ${telefone || '-'}</p>
        <p style="color:#6b7280;font-size:12px">Mensagem automática do configurador Rubstec.</p>
      </div>`.trim();

    await transporter.sendMail({
      from: `"Rubstec" <${user}>`,    // remetente deve ser o mesmo do usuário SMTP
      to,
      subject: `Seu orçamento foi recebido – ${nome}`,
      html,
      attachments: [{ filename: 'orcamento-rubstec.pdf', content: buffer, contentType: 'application/pdf' }],
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('SMTP error:', err);
    return NextResponse.json({ ok: false, error: err?.response || err?.message || 'smtp_error' }, { status: 500 });
  }
}
