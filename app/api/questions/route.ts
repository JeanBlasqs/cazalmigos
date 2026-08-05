import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import { parseJson, questionBankSchema } from "@/lib/validation/schemas";

const seedQuestions = [
  "Qual cidade combina mais com a nossa proxima viagem?",
  "Qual comida pediriamos numa sexta a noite?",
  "Qual filme veriamos de novo sem reclamar?",
  "Qual palavra descreve melhor o nosso casal?",
  "Qual lugar da casa tem mais a nossa cara?",
];

async function ensureSeedQuestions(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const { count } = await supabase.from("question_bank").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;
  await supabase.from("question_bank").insert(
    seedQuestions.map((question) => ({
      question,
      category: "base",
      active: true,
    })),
  );
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  await ensureSeedQuestions(supabase);
  const { data, error } = await supabase
    .from("question_bank")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) return jsonError(error.message, 500);
  return Response.json({ questions: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { data, error } = parseJson(questionBankSchema, body);
  if (error || !data) return jsonError("Pergunta invalida.");

  const supabase = createServerSupabaseClient();
  const { data: question, error: insertError } = await supabase
    .from("question_bank")
    .insert({ question: data.question, category: data.category ?? "custom", active: true })
    .select("*")
    .single();
  if (insertError) return jsonError(insertError.message, 500);

  return Response.json({ question });
}
