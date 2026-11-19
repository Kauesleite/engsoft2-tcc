"use client";
import { useFormStatus } from "react-dom";

export function Botao({ children, variante = "primario", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" | "perigo" | "ouro" }) {
  const { pending } = useFormStatus();
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 min-h-11";
  const v = {
    primario: "bg-verde-900 text-white hover:bg-verde-700",
    secundario: "bg-white text-verde-900 border border-verde-900/30 hover:bg-verde-50",
    perigo: "bg-white text-alerta-700 border border-alerta-700/40 hover:bg-alerta-100",
    ouro: "bg-ouro-500 text-grafite-900 hover:brightness-95",
  }[variante];
  return (
    <button {...p} disabled={pending || p.disabled} className={`${base} ${v} ${className}`}>
      {pending ? "Aguarde…" : children}
    </button>
  );
}
