import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Entenda como o Beira do Campo coleta, usa e protege seus dados pessoais.",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black text-secondary lg:text-4xl">
        Política de Privacidade
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Última atualização: {new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
      </p>

      <div className="prose-article mt-8 space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-secondary">1. Introdução</h2>
          <p>
            O <strong>Beira do Campo</strong> tem o compromisso de proteger a privacidade de nossos usuários. 
            Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas 
            informações pessoais ao acessar nosso portal e interagir com nossos serviços.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">2. Dados que Coletamos</h2>
          <p>
            Podemos coletar as seguintes informações:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Dados fornecidos diretamente:</strong> Nome e endereço de e-mail (quando você se inscreve em nossa newsletter ou entra em contato conosco).</li>
            <li><strong>Dados de navegação:</strong> Endereço IP, tipo de navegador, páginas acessadas, tempo de permanência e outras estatísticas de uso (coletados automaticamente por meio de cookies e ferramentas de análise).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">3. Como Usamos Seus Dados</h2>
          <p>
            As informações coletadas são utilizadas para:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Fornecer, operar e melhorar nossos serviços;</li>
            <li>Enviar newsletters e atualizações (caso tenha se inscrito);</li>
            <li>Responder a dúvidas, comentários e prestar suporte ao usuário;</li>
            <li>Analisar o tráfego e uso do site para aprimorar a experiência do usuário;</li>
            <li>Detectar, prevenir e resolver problemas técnicos ou de segurança.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">4. Compartilhamento de Informações</h2>
          <p>
            Não vendemos nem alugamos suas informações pessoais para terceiros. 
            Podemos compartilhar dados com parceiros prestadores de serviços (como plataformas de e-mail marketing e análise de tráfego) 
            apenas para a finalidade de executar essas funções em nosso nome, sempre sob obrigações de confidencialidade.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">5. Uso de Cookies</h2>
          <p>
            Utilizamos cookies para personalizar o conteúdo, fornecer recursos de mídia social e analisar nosso tráfego. 
            Você pode configurar seu navegador para recusar todos os cookies ou indicar quando um cookie está sendo enviado. 
            No entanto, se você não aceitar cookies, pode não conseguir usar algumas partes de nosso site de maneira ideal.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">6. Seus Direitos</h2>
          <p>
            De acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), você tem o direito de solicitar:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Acesso aos seus dados pessoais;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
            <li>Revogação do consentimento para recebimento de comunicações.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">7. Contato</h2>
          <p>
            Se você tiver dúvidas sobre esta Política de Privacidade ou desejar exercer algum de seus direitos, 
            entre em contato conosco através do e-mail: <strong>privacidade@beiradocampo.com.br</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
