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
      <p className="text-sm text-primary font-medium">
        ✓ {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          disabled={status === "loading"}
          className="flex-1 rounded bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded bg-primary px-4 py-2 text-sm font-bold transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {status === "loading" ? "..." : "OK"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-400">{message}</p>
      )}
    </form>
  );
}
