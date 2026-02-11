import nodemailer from 'nodemailer';

export const runtime = 'nodejs'; // garante nodemailer no runtime node

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`ENV faltando: ${name}`);
  return v;
}

function asBool(v: string) {
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

function sanitizeText(s: string, max = 120) {
  return String(s ?? '').replace(/[\r\n\t]/g, ' ').trim().slice(0, max);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const nome = sanitizeText(form.get('cliente_nome') as any, 80);
    const email = sanitizeText(form.get('cliente_email') as any, 120);
    const telefone = sanitizeText(form.get('cliente_telefone') as any, 40);
    const total = sanitizeText(form.get('total') as any, 30);

    const file = form.get('attachment');

    if (!nome || !email) {
      return Response.json({ ok: false, error: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ ok: false, error: 'E-mail inválido.' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: 'PDF não enviado.' }, { status: 400 });
    }

    // valida tipo/tamanho
    if (file.type !== 'application/pdf') {
      return Response.json({ ok: false, error: 'O anexo precisa ser PDF.' }, { status: 400 });
    }
    const MAX_MB = 20;
    if (file.size > MAX_MB * 1024 * 1024) {
      return Response.json({ ok: false, error: `PDF muito grande (máx. ${MAX_MB}MB).` }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    // ENV privadas (NUNCA NEXT_PUBLIC)
    const RUBSTEC_EMAIL = mustEnv('RUBSTEC_EMAIL');

    const SMTP_HOST = mustEnv('SMTP_HOST');
    const SMTP_PORT = Number(mustEnv('SMTP_PORT'));
    const SMTP_SECURE = asBool(mustEnv('SMTP_SECURE'));
    const SMTP_USER = mustEnv('SMTP_USER');
    const SMTP_PASS = mustEnv('SMTP_PASS');
    const FROM_NAME = process.env.SMTP_FROM_NAME || 'Rubstec';

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // (opcional) valida conexão
    await transporter.verify();

    const subject = `Orçamento Rubstec — ${nome} (${email})`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.4">
        <h2>Orçamento Rubstec</h2>
        <p><b>Cliente:</b> ${nome}</p>
        <p><b>E-mail:</b> ${email}</p>
        <p><b>Telefone:</b> ${telefone || '-'}</p>
        <p><b>Total:</b> R$ ${total}</p>
        <p>PDF do orçamento em anexo.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to: email,
      cc: RUBSTEC_EMAIL,
      replyTo: RUBSTEC_EMAIL,
      subject,
      html,
      attachments: [
        {
          filename: 'orcamento-rubstec.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return Response.json({ ok: true });
  } catch (err: any) {
    // NUNCA retorne stack/credenciais
    const msg = err?.message ? String(err.message).slice(0, 200) : 'Erro interno';
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
  