interface FAQItem {
  question: string;
  answer: string;
}

export function ArticleFAQ({ items }: { items: FAQItem[] }) {
  return (
    <section className="mt-12 border-t-2 border-ink pt-6">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Tira-dúvidas
      </p>
      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">
        Perguntas frequentes
      </h2>
      <dl className="mt-5 divide-y divide-ink/10">
        {items.map((item, i) => (
          <div key={i} className="flex gap-4 py-4">
            <span className="num-jersey shrink-0 text-2xl leading-none">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <dt className="font-display font-bold text-ink">
                {item.question}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-gray-600">
                {item.answer}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
