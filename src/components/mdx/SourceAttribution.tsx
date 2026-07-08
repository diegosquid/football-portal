interface SourceAttributionProps {
  name: string;
  url: string;
}

export function SourceAttribution({ name, url }: SourceAttributionProps) {
  return (
    <div className="mt-8 border-l-[3px] border-lima bg-gray-50/60 py-3 pl-4 pr-4">
      <p className="font-mono text-xs text-gray-600">
        <strong className="uppercase tracking-[0.1em]">Fonte:</strong>{" "}
        <a
          href={url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="font-medium text-primary underline decoration-lima decoration-2 underline-offset-2 hover:decoration-primary"
        >
          {name}
        </a>{" "}
        · informações adicionais por <strong>Beira do Campo</strong>
      </p>
    </div>
  );
}
