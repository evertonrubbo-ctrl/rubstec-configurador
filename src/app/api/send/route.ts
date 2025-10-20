// src/app/api/send/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** =========================================================
 *  CONFIGURAÇÃO SMTP (com override fixo + fallback de ENV)
 *  Se quiser forçar SEMPRE o fixo, deixe FORCE_OVERRIDE = true
 *  ========================================================= */
const FORCE_OVERRIDE = true;

const FIXO = {
  host: "smtp.hostinger.com",           // <<< seu host SMTP
  port: 587,                            // 587 = STARTTLS
  secure: false,                        // 465=true, 587=false
  user: "rubstec@rubstec.com.br",       // <<< seu usuário
  pass: "Rubstec@12345",               // <<< SUA SENHA AQUI (trocar!)
  toRub: "rubstec@rubstec.com.br",      // cópia pra Rubstec
};

function resolveSMTP() {
  if (FORCE_OVERRIDE) return { ...FIXO };
  return {
    host: (process.env.SMTP_HOST || FIXO.host).trim(),
    port: Number((process.env.SMTP_PORT || String(FIXO.port)).trim()),
    secure: String(process.env.SMTP_SECURE ?? String(FIXO.secure)).trim() === "true",
    user: (process.env.SMTP_USER || FIXO.user).trim(),
    pass: (process.env.SMTP_PASS || FIXO.pass).trim(),
    toRub: (process.env.NEXT_PUBLIC_RUBSTEC_EMAIL || FIXO.toRub).trim(),
  };
}

function makeTransport(nodemailer: any, smtp: ReturnType<typeof resolveSMTP>, authMethod: "LOGIN" | "PLAIN") {
  const { host, port, secure, user, pass } = smtp;
  if (!host || !user || !pass) {
    throw new Error(`SMTP incompleto: host="${host}", user="${user ? "***" : ""}"`);
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    authMethod,
    requireTLS: !secure,              // força STARTTLS no 587
    tls: { ciphers: "TLSv1.2" },
  });
}

/** GET de diagnóstico: abra https://SEU-SITE.vercel.app/api/send
 *  pra ver o host/porta/secure que o servidor está usando.
 */
export async function GET() {
  const smtp = resolveSMTP();
  return NextResponse.json({
    ok: true,
    usingOverride: FORCE_OVERRIDE,
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    user: smtp.user ? "***" : "",
    toRub: smtp.toRub,
  });
}

export async function POST(req: Request) {
  try {
    const nodemailer: any = await import("nodemailer");

    // Lê o form
    const form = await req.formData();
    const nome         = String(form.get("cliente_nome")     || "");
    const emailCliente = String(form.get("cliente_email")    || "");
    const telefone     = String(form.get("cliente_telefone") || "");
    const total        = String(form.get("total")            || "");
    const file         = form.get("attachment") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "Missing PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Resolve config e cria transporter (LOGIN -> PLAIN)
    const smtp = resolveSMTP();

    let transporter;
    try {
      transporter = makeTransport(nodemailer, smtp, "LOGIN");
      await transporter.verify();
    } catch {
      transporter = makeTransport(nodemailer, smtp, "PLAIN");
      await transporter.verify();
    }

    const to = [smtp.toRub, emailCliente].filter(Boolean).join(",");

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827">
        <h2 style="margin:0 0 8px">RUBSTEC • Confirmação de Orçamento</h2>
        <p>Olá <b>${nome}</b>, recebemos seu orçamento. A equipe Rubstec agradece a preferência!</p>
        <p>Em breve retornaremos com frete, prazo e disponibilidade. O PDF segue em anexo.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p><b>Total estimado:</b> R$ ${total}</p>
        <p><b>Contato:</b> ${emailCliente} • ${telefone || "-"}</p>
        <p style="color:#6b7280;font-size:12px">Mensagem automática do configurador Rubstec.</p>
      </div>
    `.trim();

    await transporter.sendMail({
      from: `"Rubstec" <${smtp.user}>`,
      to,
      subject: `Seu orçamento foi recebido – ${nome}`,
      html,
      attachments: [
        { filename: "orcamento-rubstec.pdf", content: buffer, contentType: "application/pdf" }
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg = err?.response || err?.message || "smtp_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
