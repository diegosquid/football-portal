interface FAQItem {
  question: string;
  answer: string;
}

export function ArticleFAQ({ items }: { items: FAQItem[] }) {
  return (
    <section className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
      <h2 className="mb-4 text-xl font-bold text-secondary">
        Perguntas frequentes
      </h2>
      <dl className="space-y-4">
        {items.map((item, i) => (
          <div key={i}>
            <dt className="font-semibold text-secondary">{item.question}</dt>
            <dd className="mt-1 text-gray-700">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
