import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile } = await adminClient.from("profiles").select("is_admin").eq("user_id", user.id).single();

  if (!profile?.is_admin) {
    return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { appointment_id } = await req.json();
  if (!appointment_id) {
    return new Response(JSON.stringify({ error: "ID do agendamento é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { error } = await adminClient.from("appointments").update({ status: "cancelado" }).eq("id", appointment_id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
