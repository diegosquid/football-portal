import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-black text-primary">404</h1>
      <p className="mt-4 text-xl font-bold text-secondary">
        Página não encontrada
      </p>
      <p className="mt-2 text-gray-500">
        A página que você procura não existe ou foi removida.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
      >
        Voltar para a Home
      </Link>
    </div>
  );
}
