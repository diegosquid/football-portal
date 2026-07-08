"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error);
      }
    } catch {
      setStatus("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  }

  if (status === "success") {
    return (
      <p className="font-mono text-sm font-medium text-lima">✓ {message}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          disabled={status === "loading"}
          className="min-w-0 flex-1 border border-cal/25 bg-transparent px-3 py-2.5 font-mono text-sm text-cal placeholder:text-cal/35 focus:border-lima focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 border border-lima bg-lima px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-ink transition-colors hover:bg-cal hover:border-cal disabled:opacity-50"
        >
          {status === "loading" ? "..." : "OK"}
        </button>
      </div>
      {status === "error" && (
        <p className="font-mono text-xs text-[#ff8f7a]">{message}</p>
      )}
    </form>
  );
}
