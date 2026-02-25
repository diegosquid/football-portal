interface SourceAttributionProps {
  name: string;
  url: string;
}

export function SourceAttribution({ name, url }: SourceAttributionProps) {
  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm text-gray-600">
        <strong>Fonte:</strong>{" "}
        <a
          href={url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="text-primary hover:underline"
        >
          {name}
        </a>{" "}
        | Informações adicionais por{" "}
        <strong>Beira do Campo</strong>
      </p>
    </div>
  );
}
