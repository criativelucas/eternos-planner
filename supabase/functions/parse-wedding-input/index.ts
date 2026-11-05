import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(today: string, weddingDate: string): string {
  return `CONTEXTO IMPORTANTE: A data de hoje é ${today}. O casamento está marcado para ${weddingDate}.

REGRAS CRÍTICAS (siga TODAS sem exceção):
1. Parcelas NÃO pagas e prazos devem estar entre ${today} e ${weddingDate}, nunca após o casamento. Parcelas já pagas (pago=true) podem ter datas passadas — use a data informada ou, se não houver, ${today}.
2. Se o usuário não especificar mês/ano, distribua as parcelas não pagas mensalmente a partir de ${today}, uma por mês. Se não houver meses suficientes antes do casamento, a última parcela vence em ${weddingDate}.
3. A soma de TODAS as parcelas DEVE ser exatamente igual a valorTotal (tolerância de R$ 0,01). Distribua o valor de forma proporcional.
4. Se valorPago > 0, marque as PRIMEIRAS parcelas (em ordem cronológica) como pago=true até a soma das pagas igualar valorPago.
5. Se valorPago = 0, todas as parcelas devem ter pago=false.

Você é um assistente de planejamento de casamento. O usuário vai te dizer algo sobre os preparativos do casamento em linguagem natural. Extraia as informações e retorne APENAS um JSON válido, sem texto extra, no seguinte formato:

{
  "action": "add" | "update" | "delete",
  "item": {
    "nome": string,
    "categoria": "Venue" | "Buffet" | "Decoração" | "Foto/Vídeo" | "Vestuário" | "Música" | "Convites" | "Lua de Mel" | "Beleza" | "Alianças" | "Bolo" | "Flores" | "Transporte" | "Outros",
    "valorTotal": number (em reais),
    "valorPago": number (em reais),
    "parcelas": [{ "numero": number, "valor": number, "dataVencimento": string (YYYY-MM-DD), "pago": boolean }],
    "prazo": string (YYYY-MM-DD) | null,
    "status": "pendente" | "em_andamento" | "concluido" | "cancelado",
    "fornecedor": string | null,
    "notas": string | null,
    "prioridade": "alta" | "media" | "baixa"
  }
}

Se algum campo não for mencionado, use null ou valores padrão razoáveis. Para parcelas, calcule as datas estimadas se não forem mencionadas (uma por mês a partir do próximo mês, sem ultrapassar a data do casamento). Sempre responda APENAS com JSON válido. Valores monetários brasileiros usam ponto como separador de milhar (ex: R$4.500 = 4500 reais).`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const message: string = body?.message;
    const weddingDate: string = body?.weddingDate || "2026-08-29";
    const today = new Date().toISOString().split("T")[0];

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Mensagem vazia" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing message:", message, "today=", today, "wedding=", weddingDate);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: buildSystemPrompt(today, weddingDate) },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI response:", content);

    if (!content) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
