import { redirect } from "next/navigation";
import { usuarioAtual, rotaInicial } from "@/lib/sessao";

export default async function Home() {
  const u = await usuarioAtual();
  redirect(u ? rotaInicial(u.perfil) : "/login");
}
