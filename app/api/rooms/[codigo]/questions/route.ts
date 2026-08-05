import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import { parseJson, roomQuestionsSchema } from "@/lib/validation/schemas";

async function getRoom(supabase: ReturnType<typeof createServerSupabaseClient>, codigo: string) {
  return (await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle()).data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const supabase = createServerSupabaseClient();
  const room = await getRoom(supabase, codigo);
  if (!room) return jsonError("Sala nao encontrada.", 404);

  const { data } = await supabase.from("room_question_selections").select("question_bank_id").eq("room_id", room.id);
  return Response.json({ questionIds: data?.map((item) => item.question_bank_id) ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const body = await request.json().catch(() => null);
  const { data, error } = parseJson(roomQuestionsSchema, body);
  if (error || !data) return jsonError("Selecione pelo menos uma pergunta.");

  const supabase = createServerSupabaseClient();
  const room = await getRoom(supabase, codigo);
  if (!room) return jsonError("Sala nao encontrada.", 404);

  await supabase.from("room_question_selections").delete().eq("room_id", room.id);
  const { error: insertError } = await supabase.from("room_question_selections").insert(
    data.questionIds.map((questionId) => ({
      room_id: room.id,
      question_bank_id: questionId,
    })),
  );
  if (insertError) return jsonError(insertError.message, 500);

  return Response.json({ questionIds: data.questionIds });
}
