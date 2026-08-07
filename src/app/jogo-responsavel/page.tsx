import type { Metadata } from "next";
import Link from "next/link";

const AUTOEXCLUSAO_URL =
  "https://www.gov.br/pt-br/servicos/plataforma-centralizada-de-autoexclusao-apostas";
const JOGO_RESPONSAVEL_URL =
  "https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/jogo-responsavel/jogo-responsavel/";
const CAPS_URL =
  "https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps/caps";
const CVV_URL = "https://cvv.org.br/";

export const metadata: Metadata = {
  title: "Jogo Responsável, Autoexclusão e Canais de Apoio",
  description:
    "Informações sobre jogo responsável, sinais de risco, autoexclusão de sites de apostas e canais gratuitos de apoio no Brasil.",
  alternates: { canonical: "/jogo-responsavel" },
};

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>;
}

const warningSigns = [
  "Apostar mais dinheiro ou por mais tempo do que havia planejado.",
  "Tentar recuperar perdas aumentando o valor ou a frequência das apostas.",
  "Usar dinheiro destinado a moradia, alimentação, saúde ou outras necessidades.",
  "Pedir dinheiro emprestado, vender bens ou esconder apostas de pessoas próximas.",
  "Sentir ansiedade, irritação ou culpa e prejudicar sono, trabalho ou relacionamentos.",
];

const protectionSteps = [
  "Nunca trate apostas como renda, investimento ou solução para dívidas.",
  "Não use crédito, empréstimos ou dinheiro necessário para despesas essenciais.",
  "Defina previamente limites rígidos de tempo e de gasto — e não os aumente para recuperar perdas.",
  "Evite apostar sob efeito de álcool, em sofrimento emocional ou após uma perda.",
  "Interrompa a atividade e procure apoio ao perceber qualquer perda de controle.",
];

export default function JogoResponsavelPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative bg-campo-deep text-cal">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-lima/15"
        />
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-lima/10"
        />

        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 border border-lima/35 bg-lima/10 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-lima">
            <span className="h-2 w-2 rounded-full bg-lima" aria-hidden="true" />
            18+ · Informação e apoio
          </div>

          <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
            Jogo responsável
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cal/75 sm:text-xl">
            Apostas envolvem risco real de perda. Se deixaram de ser diversão,
            pare e procure ajuda — quanto antes, melhor.
          </p>

          <div className="mt-9 max-w-3xl border-l-4 border-lima bg-cal px-5 py-5 text-ink sm:px-7">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-campo">
              Aviso obrigatório
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
              Ministério da Fazenda adverte: Aposta não é investimento.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={AUTOEXCLUSAO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-lima px-5 py-3 text-center font-bold text-ink transition hover:bg-cal"
            >
              Solicitar autoexclusão no Gov.br <ExternalArrow />
            </a>
            <a
              href="#onde-buscar-ajuda"
              className="inline-flex min-h-12 items-center justify-center border border-cal/25 px-5 py-3 text-center font-bold text-cal transition hover:border-cal hover:bg-cal/10"
            >
              Ver canais de apoio
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <section aria-labelledby="essencial-title">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Antes de tudo
          </p>
          <h2
            id="essencial-title"
            className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl"
          >
            Três fatos que não mudam
          </h2>

          <div className="mt-7 grid gap-px bg-ink/15 sm:grid-cols-3">
            {[
              ["01", "Não há ganho garantido", "Todo resultado é incerto e perder faz parte do risco."],
              ["02", "Probabilidade não é previsão", "Estatísticas estimam cenários; não determinam o que acontecerá."],
              ["03", "Nunca é solução financeira", "Apostar não paga dívidas e não substitui renda ou investimento."],
            ].map(([number, title, description]) => (
              <article key={number} className="bg-cal p-6 sm:p-7">
                <span className="font-mono text-sm font-bold text-primary">{number}</span>
                <h3 className="mt-5 font-display text-xl font-extrabold text-ink">
                  {title}
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12" aria-labelledby="sinais-title">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Reconheça cedo
            </p>
            <h2
              id="sinais-title"
              className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl"
            >
              Sinais de alerta
            </h2>
            <p className="mt-4 leading-relaxed text-gray-600">
              Um único sinal já merece atenção. Não é necessário esperar uma
              crise ou uma dívida crescer para interromper as apostas.
            </p>

            <ul className="mt-7 space-y-4">
              {warningSigns.map((sign) => (
                <li key={sign} className="flex gap-3 leading-relaxed text-gray-700">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                  />
                  {sign}
                </li>
              ))}
            </ul>
          </div>

          <aside className="self-start bg-campo p-7 text-cal sm:p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lima">
              Se você se identificou
            </p>
            <h3 className="mt-3 font-display text-3xl font-extrabold">
              Pare agora. Você não precisa recuperar o que perdeu.
            </h3>
            <p className="mt-4 leading-relaxed text-cal/75">
              Afaste-se dos aplicativos, converse com alguém de confiança e use
              a autoexclusão para bloquear o acesso às plataformas autorizadas.
            </p>
            <a
              href={AUTOEXCLUSAO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 font-bold text-lima underline decoration-lima/50 underline-offset-4 hover:text-cal"
            >
              Acessar o serviço oficial <ExternalArrow />
            </a>
          </aside>
        </section>

        <section className="mt-16 border-y border-ink/15 py-10" aria-labelledby="protecao-title">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Redução de danos
              </p>
              <h2
                id="protecao-title"
                className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl"
              >
                Medidas de proteção
              </h2>
            </div>
            <ol className="space-y-5">
              {protectionSteps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-bold text-cal">
                    {index + 1}
                  </span>
                  <p className="pt-1 leading-relaxed text-gray-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="autoexclusao" className="mt-16" aria-labelledby="autoexclusao-title">
          <div className="bg-lima p-7 sm:p-10">
            <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-campo">
                  Serviço gratuito do Governo Federal
                </p>
                <h2
                  id="autoexclusao-title"
                  className="mt-2 max-w-3xl font-display text-3xl font-extrabold text-ink sm:text-4xl"
                >
                  Autoexclusão centralizada
                </h2>
                <p className="mt-4 max-w-3xl leading-relaxed text-ink/75">
                  O serviço permite solicitar o bloqueio, por prazo determinado
                  ou indeterminado, em todas as plataformas de apostas autorizadas
                  pela Secretaria de Prêmios e Apostas. Também impede novas contas
                  com o CPF e o envio de publicidade direcionada pelos operadores.
                </p>
                <p className="mt-3 text-sm font-semibold text-ink/65">
                  É necessário entrar com uma conta Gov.br de nível prata ou ouro.
                  A efetivação pode levar até 72 horas.
                </p>
              </div>
              <a
                href={AUTOEXCLUSAO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-5 py-3 text-center font-bold text-cal transition hover:bg-campo"
              >
                Iniciar no Gov.br <ExternalArrow />
              </a>
            </div>
          </div>
        </section>

        <section id="onde-buscar-ajuda" className="mt-16 scroll-mt-8" aria-labelledby="ajuda-title">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Atendimento e acolhimento
          </p>
          <h2
            id="ajuda-title"
            className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl"
          >
            Onde buscar ajuda
          </h2>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <article className="border border-ink/15 bg-white/35 p-6 sm:p-7">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Atendimento pelo SUS
              </p>
              <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">
                UBS e CAPS
              </h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                O acolhimento pode começar gratuitamente em uma Unidade Básica
                de Saúde. Também é possível procurar diretamente um CAPS; não é
                necessário agendar o primeiro acolhimento.
              </p>
              <a
                href={CAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 font-bold text-primary underline decoration-primary/30 underline-offset-4 hover:text-primary-dark"
              >
                Orientações do Ministério da Saúde <ExternalArrow />
              </a>
            </article>

            <article className="border border-ink/15 bg-white/35 p-6 sm:p-7">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Apoio emocional
              </p>
              <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">
                CVV — telefone 188
              </h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                O Centro de Valorização da Vida oferece apoio emocional gratuito
                e sigiloso pelo telefone 188, 24 horas por dia, além de chat e
                e-mail.
              </p>
              <a
                href={CVV_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 font-bold text-primary underline decoration-primary/30 underline-offset-4 hover:text-primary-dark"
              >
                Acessar o CVV <ExternalArrow />
              </a>
            </article>
          </div>

          <div className="mt-5 border border-red-700/20 bg-red-700/5 px-5 py-4 text-sm leading-relaxed text-gray-700">
            <strong className="text-ink">Em uma situação de urgência:</strong>{" "}
            ligue para o SAMU no número 192 ou procure uma UPA 24h ou
            pronto-socorro. Esses serviços também acolhem crises de saúde mental.
          </div>
        </section>

        <section className="mt-16 bg-ink px-7 py-9 text-cal sm:px-10" aria-labelledby="compromisso-title">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lima">
            Transparência
          </p>
          <h2
            id="compromisso-title"
            className="mt-2 font-display text-3xl font-extrabold sm:text-4xl"
          >
            O compromisso do Beira do Campo
          </h2>
          <div className="mt-5 space-y-4 leading-relaxed text-cal/75">
            <p>
              O Beira do Campo é um portal editorial de futebol e análise
              estatística. Não recebe apostas, não mantém saldo de jogadores e
              não opera serviços de jogos ou apostas.
            </p>
            <p>
              Algumas páginas contêm publicidade e links de afiliados,
              identificados como parceria comercial. Podemos ser remunerados por
              ações realizadas por meio desses links. Essa relação não transforma
              probabilidades, palpites ou análises em garantia de resultado.
            </p>
            <p>
              Se você tiver menos de 18 anos, não acesse plataformas de apostas.
            </p>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="fontes-title">
          <h2 id="fontes-title" className="font-display text-2xl font-extrabold text-ink">
            Fontes e recursos oficiais
          </h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a
                href={AUTOEXCLUSAO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:text-primary-dark"
              >
                Plataforma Centralizada de Autoexclusão — Gov.br <ExternalArrow />
              </a>
            </li>
            <li>
              <a
                href={JOGO_RESPONSAVEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:text-primary-dark"
              >
                Jogo Responsável — Secretaria de Prêmios e Apostas <ExternalArrow />
              </a>
            </li>
            <li>
              <a
                href={CAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:text-primary-dark"
              >
                Centros de Atenção Psicossocial — Ministério da Saúde <ExternalArrow />
              </a>
            </li>
          </ul>

          <p className="mt-8 text-sm text-gray-500">
            Última atualização: 7 de agosto de 2026 · Dúvidas sobre esta página?{" "}
            <Link
              href="mailto:contato@beiradocampo.com.br"
              className="font-semibold text-primary underline underline-offset-4"
            >
              contato@beiradocampo.com.br
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
