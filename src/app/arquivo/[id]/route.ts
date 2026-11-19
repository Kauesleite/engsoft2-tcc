import { NextResponse } from "next/server";
import { usuarioAtual } from "@/lib/sessao";
import { arquivoDaEntrega } from "@/services/consultas";
import { ErroDeDominio } from "@/domain/erros";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioAtual();
  if (!u) return new NextResponse("Não autenticado", { status: 401 });
  try {
    const a = await arquivoDaEntrega(u, Number((await params).id));
    return new NextResponse(Buffer.from(a.dados), {
      headers: {
        "Content-Type": a.tipo,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(a.nome)}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    if (e instanceof ErroDeDominio) return new NextResponse(e.message, { status: e.codigo === "NAO_ENCONTRADO" ? 404 : 403 });
    throw e;
  }
}
