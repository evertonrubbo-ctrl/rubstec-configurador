'use client';
import { useRouter } from 'next/navigation';
import type { SVGProps, ComponentType, ReactElement } from 'react';

/** Versão anterior (cards com gradiente, badges, ícones) + LOGO no topo **/


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

export default function StartConfigurator() {
  const router = useRouter();

  const services: Service[] = [
    {
      title: 'Identificador de Fios com Etiqueta Personalizada',
      subtitle: 'Gravamos ou aplicamos etiquetas sob medida com códigos, numeração ou textos exclusivos em cada identificador.',
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
  ];

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10">
      {/* Fundo decorativo */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-64 bg-gradient-to-b from-blue-50 to-transparent" />

      <header className="mb-8 text-center">
        {/* LOGO — ajuste o caminho da sua arte */}
        <div className="mb-4 flex items-center justify-center">
          <img
            src="/images/rubstec_logo.svg" 
            alt="Rubstec Materiais Elétricos" 
            className="h-16 w-auto"
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

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <button
            key={i}
            onClick={() => router.push(s.href)}
            className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm ring-1 ring-black/5 transition-all hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={s.title}
          >
            {/* faixa gradiente superior */}
            <div
              className="h-1.5 w-full"
              style={{ background: `linear-gradient(90deg, ${s.accentFrom}, ${s.accentTo})` }}
            />

            {/* imagem opcional */}
            {s.imageUrl ? (
              <div className="aspect-[16/9] w-full overflow-hidden bg-gray-50">
                <img
                  src={s.imageUrl}
                  alt="Imagem ilustrativa do serviço"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
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
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                background: 'radial-gradient(600px circle at var(--x,50%) var(--y,20%), rgba(59,130,246,.08), transparent 40%)',
              }}
            />
          </button>
        ))}
      </section>

      <footer className="mx-auto mt-8 max-w-3xl text-center text-xs text-gray-500">
        Configure online e receba seus fios e identificadores prontos, com total precisão e qualidade Rubstec.
      </footer>

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
