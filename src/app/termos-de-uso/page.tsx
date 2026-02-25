import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Conheça os termos e condições de uso do portal Beira do Campo.",
  alternates: { canonical: "/termos-de-uso" },
};

export default function TermosUsoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black text-secondary lg:text-4xl">
        Termos de Uso
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <div className="prose-article mt-8 space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-secondary">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar o portal <strong>Beira do Campo</strong>, você concorda em cumprir e ficar vinculado 
            a estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve usar nosso portal.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">2. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo presente neste portal, incluindo, mas não se limitando a textos, artigos, análises, gráficos, logotipos, imagens e software, 
            é de propriedade do <strong>Beira do Campo</strong> ou de seus licenciadores e está protegido pelas leis de direitos autorais e de propriedade intelectual.
          </p>
          <p className="mt-2">
            É terminantemente proibida a reprodução, distribuição, modificação ou publicação de qualquer conteúdo do nosso portal em outros sites 
            ou meios de comunicação sem a nossa autorização prévia e expressa por escrito.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">3. Uso do Portal</h2>
          <p>
            Você concorda em usar nosso portal apenas para fins lícitos e de maneira que não infrinja os direitos de terceiros, 
            nem restrinja ou iniba o uso e o aproveitamento do portal por qualquer outra pessoa.
          </p>
          <p className="mt-2">Condutas proibidas incluem, mas não se limitam a:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Assediar, causar angústia ou inconveniência a qualquer pessoa;</li>
            <li>Transmitir conteúdo obsceno ou ofensivo;</li>
            <li>Interromper o fluxo normal de diálogo dentro de nosso portal.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">4. Conteúdo Gerado por Usuários</h2>
          <p>
            Ao enviar comentários, sugestões ou qualquer outro conteúdo para o nosso portal (seja através de comentários nas matérias ou redes sociais), 
            você nos concede uma licença não exclusiva, perpétua, irrevogável, isenta de royalties e mundial para usar, reproduzir, modificar, 
            adaptar, publicar, traduzir, distribuir e exibir esse conteúdo.
          </p>
          <p className="mt-2">
            Reservamo-nos o direito de remover qualquer conteúdo de usuário que consideremos, a nosso exclusivo critério, 
            inadequado, ofensivo, ou que viole estes Termos de Uso.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">5. Links para Terceiros</h2>
          <p>
            Nosso portal pode conter links para sites de terceiros que não são controlados ou operados pelo Beira do Campo. 
            Não assumimos responsabilidade pelo conteúdo, políticas de privacidade ou práticas de quaisquer sites de terceiros. 
            Recomendamos que você leia os termos e condições e as políticas de privacidade de qualquer site de terceiros que visitar.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">6. Isenção de Responsabilidade</h2>
          <p>
            Embora nos esforcemos para manter as informações do portal precisas e atualizadas, o Beira do Campo 
            não garante a exatidão, integralidade ou atualidade do conteúdo jornalístico, de opinião ou estatístico.
          </p>
          <p className="mt-2">
            O uso das informações obtidas em nosso portal é de sua inteira responsabilidade. Não nos responsabilizamos 
            por quaisquer perdas ou danos decorrentes do uso de nosso portal.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">7. Alterações nos Termos</h2>
          <p>
            O Beira do Campo reserva o direito de modificar estes Termos de Uso a qualquer momento. 
            As alterações entrarão em vigor imediatamente após a publicação no portal. 
            Seu uso contínuo do site após quaisquer alterações constitui sua aceitação dos novos Termos de Uso.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary">8. Contato</h2>
          <p>
            Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através do e-mail: <strong>contato@beiradocampo.com.br</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
