import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { items } = await req.json();
    const lista = (items || []).map((i: any) => `- ${i.nome} (${i.categoria})`).join("\n") || "(nenhum item ainda)";

    const SYSTEM = `Você é um especialista em planejamento de casamentos brasileiros. O usuário tem o seguinte planejamento até agora:

${lista}

Analise o que está faltando para um casamento completo e sugira entre 8 e 12 itens que provavelmente ainda não foram adicionados. Para cada item sugerido, estime um valor médio de mercado em Reais (mercado brasileiro, 2025-2026).

Categorias válidas: Venue, Buffet, Decoração, Foto/Vídeo, Vestuário, Música, Convites, Lua de Mel, Beleza, Alianças, Bolo, Flores, Transporte, Outros.

Retorne APENAS JSON válido, sem texto extra:
{
  "sugestoes": [
    { "nome": string, "categoria": string, "valorEstimado": number, "prioridade": "alta"|"media"|"baixa", "motivo": string }
  ]
}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: "Gere as sugestões agora." },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Muitas requisições, tente novamente." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro ao chamar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let content = (data.choices?.[0]?.message?.content || "").trim();
    if (content.startsWith("```")) content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || "Erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
