import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(2).max(40),
  avatar: z.string().trim().max(40).optional(),
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(2).max(40).optional(),
  avatar: z.string().trim().max(40).optional(),
  reconnectToken: z.string().uuid().optional(),
});

export const teamsSchema = z.object({
  mode: z.enum(["auto", "manual"]).default("auto"),
  teams: z.record(z.string().uuid(), z.enum(["a", "b"])).optional(),
});

export const answerSchema = z.object({
  playerId: z.string().uuid(),
  answer: z.string().trim().min(1).max(120),
  bet: z.coerce.number().int().min(1).max(10),
});

export const validateAnswerSchema = z.object({
  playerId: z.string().uuid(),
  approved: z.boolean(),
});

export const updatePlayerSchema = z.object({
  playerId: z.string().uuid(),
  team: z.enum(["a", "b"]).optional(),
  avatar: z.string().trim().max(40).optional(),
  ready: z.boolean().optional(),
});

export const questionBankSchema = z.object({
  question: z.string().trim().min(4).max(180),
  category: z.string().trim().max(40).optional(),
});

export const roomQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1),
});

export function parseJson<T>(schema: z.ZodSchema<T>, body: unknown) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { data: null, error: parsed.error.flatten() };
  }
  return { data: parsed.data, error: null };
}
