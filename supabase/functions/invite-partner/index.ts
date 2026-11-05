import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { partnerEmail, configId } = await req.json();

    if (!partnerEmail || !configId) {
      return new Response(JSON.stringify({ error: "Email e configId são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the user owns this config
    const { data: configData } = await supabaseAdmin
      .from("wedding_config")
      .select("id, user_id")
      .eq("id", configId)
      .single();

    if (!configData || configData.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Você não tem permissão para convidar neste planejamento" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reuse an existing pending invite for this email instead of creating duplicates
    const { data: existingInv } = await supabaseAdmin.from("couple_invites")
      .select("id").eq("config_id", configId).ilike("invite_email", partnerEmail).eq("accepted", false).limit(1);
    let createdInviteId: string | null = null;
    if (!existingInv || existingInv.length === 0) {
      const { data: ins, error: insertError } = await supabaseAdmin.from("couple_invites").insert({
        config_id: configId,
        invite_email: partnerEmail,
        invited_by: userId,
      }).select("id").single();
      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      createdInviteId = ins.id;
    }

    // Send real invite email via Supabase Admin
    const redirectTo = "https://eternos-planner.lovable.app/accept-invite";

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      partnerEmail,
      { redirectTo }
    );

    if (inviteError) {
      console.error("Invite error:", inviteError);
      if (createdInviteId) await supabaseAdmin.from("couple_invites").delete().eq("id", createdInviteId);
      return new Response(JSON.stringify({ error: `Erro ao enviar convite: ${inviteError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Invite sent successfully to:", partnerEmail);

    return new Response(JSON.stringify({ success: true, email: partnerEmail }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
