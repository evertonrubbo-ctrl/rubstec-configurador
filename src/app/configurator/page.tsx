'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { SVGProps, ComponentType, ReactElement } from 'react';

/** Versão com logo reduzido, imagens object-contain e WhatsApp de suporte **/

type Service = {
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  imageUrl?: string;
  accentFrom: string;
  accentTo: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const CableIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path d="M4 8c0-2.209 1.791-4 4-4s4 1.791 4 4v8a4 4 0 0 0 8 0" />
    <path d="M4 12h8M4 16h8" />
    <circle cx="20" cy="16" r="2.75" />
  </svg>
);

const TagIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path d="M3 12l9-9 9 9-9 9-9-9z" />
    <circle cx="12" cy="8.5" r="1.5" />
  </svg>
);

const TerminalIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path d="M3 6h10v6H3zM13 9h8M17 9v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1" />
    <path d="M6 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/** Ícone WhatsApp */
const WhatsIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M19.11 17.66c-.27-.14-1.56-.77-1.8-.85-.24-.09-.41-.14-.59.14-.18.27-.68.85-.83 1.02-.15.18-.31.2-.58.07-.27-.14-1.12-.41-2.13-1.31-.79-.71-1.32-1.59-1.47-1.86-.15-.27-.02-.42.12-.56.13-.13.27-.31.41-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.59-1.42-.81-1.95-.21-.5-.42-.43-.59-.44-.15-.01-.33-.01-.5-.01s-.48.07-.73.34c-.25.27-.96.94-.96 2.29 0 1.35.99 2.66 1.12 2.84.14.18 1.95 2.98 4.8 4.16 2.85 1.18 2.85.79 3.37.75.52-.04 1.56-.64 1.78-1.26.22-.62.22-1.14.15-1.26-.07-.12-.25-.2-.52-.34zM27.8 15.9c0 6.6-5.35 11.95-11.95 11.95-2.36 0-4.56-.69-6.4-1.88L4 28l2.12-5.26a11.88 11.88 0 0 1-1.26-5.84C4.86 10.3 10.21 5 16.85 5c3.19 0 6.07 1.24 8.16 3.25A11.9 11.9 0 0 1 27.8 15.9z"
    />
  </svg>
);

export default function StartConfigurator() {
  const router = useRouter();

  /** Inicializa Pixel + PageView **/
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const w = window as any;

    // evita inicializar duas vezes
    if (!w.fbq) {
      w.fbq = function (...args: any[]) {
        if (w.fbq.callMethod) {
          w.fbq.callMethod(...args);
        } else {
          w.fbq.queue.push(args);
        }
      };
      if (!w._fbq) w._fbq = w.fbq;
      w.fbq.push = w.fbq;
      w.fbq.loaded = true;
      w.fbq.version = '2.0';
      w.fbq.queue = [];

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';

      const firstScript = document.getElementsByTagName('script')[0];
      firstScript?.parentNode?.insertBefore(script, firstScript);
    }

    // inicializa com seu ID
    w.fbq('init', '642834115555979');
    w.fbq('track', 'PageView');
  }, []);

  /** helper para eventos do Pixel **/
  const trackFbEvent = (event: string, params?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    if (!w.fbq) return;
    w.fbq('track', event, params);
  };

  /** WhatsApp */
  const whatsappNumber = '5554991104548';
  const waText =
    'Olá! Tenho uma dúvida sobre os serviços de identificação (fios, bornes, cabos e trilhos) da Rubstec.';
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waText)}`;

  const services: Service[] = [
    {
      title: 'Identificador de Fios com Etiqueta Personalizada',
      subtitle:
        'Gravamos ou aplicamos etiquetas sob medida com códigos, numeração ou textos exclusivos em cada identificador.',
      href: '/configurator/identificador',
      badge: 'Mais pedido',
      accentFrom: '#0ea5e9',
      accentTo: '#22d3ee',
      imageUrl: '/images/Identificacao_fios.png',
      Icon: TagIcon,
    },
    {
      title: 'Fios com Terminais + Identificador',
      subtitle: 'Corte na metragem, crimpagem de terminais e identificação pronta para instalar.',
      href: '/configurator/cabos',
      badge: 'Kit completo',
      accentFrom: '#22c55e',
      accentTo: '#a3e635',
      imageUrl: '/images/Terminal_identificacao_fios.png',
      Icon: TerminalIcon,
    },
    {
      title: 'Identificação de Bornes – Phoenix Contact',
      subtitle: 'Impressão profissional em cartelas (UCT) para Bornes Phoenix.',
      href: '/configurator/bornes',
      accentFrom: '#f59e0b',
      accentTo: '#f97316',
      imageUrl: '/images/Identificacao_bornes.png',
      Icon: CableIcon,
    },
    /* NOVO SERVIÇO – CORTE DE TRILHO TS */
    {
      title: 'Corte de Trilho TS 35X7,5 Sob Medida',
      subtitle:
        'Realizamos de cortes em trilhos TS35X7,5 pronto para montagem do painel.',
      href: '/configurator/trilho-ts',
      badge: 'Novo',
      accentFrom: '#6366f1',
      accentTo: '#8b5cf6',
      // se ainda não tiver a imagem, pode remover a linha abaixo ou trocar o caminho
      imageUrl: '/images/Corte_trilho_ts.png',
      Icon: CableIcon,
    },
  ];

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10">
      {/* Fundo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-64 bg-gradient-to-b from-blue-50 to-transparent"
      />

      <header className="mb-8 text-center">
        {/* LOGO — tamanho reduzido e mais profissional */}
        <div className="mb-4 flex items-center justify-center">
          <img
            src="/images/rubstec_logo.svg"
            alt="Rubstec Materiais Elétricos"
            width={180}
            height={44}
            style={{ height: 44, width: 'auto', maxHeight: 48 }}
          />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-gray-600 bg-white/70 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Serviços sob medida
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Qual serviço você precisa?</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
          Escolha abaixo. Cada opção abre um configurador simples e rápido.
        </p>
      </header>

      {/* Cards dos serviços */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              trackFbEvent('ViewContent', {
                content_name: s.title,
                content_category: 'Configurador Rubstec',
              });
              router.push(s.href);
            }}
            className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm ring-1 ring-black/5 transition-all hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={s.title}
          >
            {/* faixa gradiente superior */}
            <div
              className="h-1.5 w-full"
              style={{ background: `linear-gradient(90deg, ${s.accentFrom}, ${s.accentTo})` }}
            />

            {/* imagem centralizada e contida */}
            {s.imageUrl ? (
              <div className="aspect-[16/9] w-full overflow-hidden bg-white flex items-center justify-center p-3">
                <img src={s.imageUrl} alt={s.title} className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <s.Icon className="h-16 w-16 text-gray-500 transition-transform duration-500 group-hover:scale-110" />
              </div>
            )}

            {/* conteúdo */}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold leading-tight text-gray-900">{s.title}</h2>
                {s.badge && (
                  <span className="rounded-full bg-gray-900/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {s.badge}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600">{s.subtitle}</p>

              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors group-hover:border-gray-300">
                  <span>Configurar agora</span>
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </div>
                <div
                  className="h-2 w-10 rounded-full opacity-60"
                  style={{ background: `linear-gradient(90deg, ${s.accentFrom}, ${s.accentTo})` }}
                />
              </div>
            </div>

            {/* brilho no hover */}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  'radial-gradient(600px circle at var(--x,50%) var(--y,20%), rgba(59,130,246,.08), transparent 40%)',
              }}
            />
          </button>
        ))}
      </section>

      {/* Banner de dúvidas com WhatsApp */}
      <section className="mx-auto mt-10 max-w-5xl">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border bg-white/80 p-5 shadow-sm ring-1 ring-black/5 sm:flex-row">
          <div className="flex items-center gap-3 text-gray-800">
            <WhatsIcon className="h-6 w-6 text-emerald-500" />
            <p className="text-sm">
              <span className="font-semibold">Ficou com alguma dúvida?</span> Fale com nosso time no WhatsApp.
            </p>
          </div>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar no WhatsApp"
            onClick={() =>
              trackFbEvent('Contact', {
                contact_channel: 'WhatsApp',
                position: 'banner_inferior',
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            <WhatsIcon className="h-4 w-4 text-white" />
            +55 54 99110-4548
          </a>
        </div>
      </section>

      <footer className="mx-auto mt-8 max-w-3xl text-center text-xs text-gray-500">
        Configure online e receba seus fios, trilhos e identificadores prontos, com total precisão e qualidade
        Rubstec.
      </footer>

      {/* Botão flutuante do WhatsApp */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp Rubstec"
        onClick={() =>
          trackFbEvent('Contact', {
            contact_channel: 'WhatsApp',
            position: 'botao_flotuante',
          })
        }
        className="fixed bottom-4 right-4 z-50 inline-flex items-center justify-center rounded-full bg-emerald-500 p-3 text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        <WhatsIcon className="h-6 w-6 text-white" />
      </a>

      {/* Efeito de brilho acompanha o cursor */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelectorAll('button.group').forEach((el) => {
              el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--x', (e.clientX - r.left) + 'px');
                el.style.setProperty('--y', (e.clientY - r.top) + 'px');
              });
            });
          `,
        }}
      />
    </main>
  );
}
