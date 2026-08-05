"use client";

import { useEffect, useState } from "react";
import type { QuestionBankItem } from "@/lib/game/types";

export function QuestionsModal({
  roomCode,
  open,
  onClose,
}: {
  roomCode: string;
  open: boolean;
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/questions").then((response) => response.json()),
      fetch(`/api/rooms/${roomCode}/questions`).then((response) => response.json()),
    ]).then(([bank, room]) => {
      const list = bank.questions ?? [];
      setQuestions(list);
      setSelected(room.questionIds?.length ? room.questionIds : list.map((item: QuestionBankItem) => item.id));
    });
  }, [open, roomCode]);

  async function addQuestion() {
    if (!newQuestion.trim()) return;
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion }),
    });
    if (!response.ok) return;
    const payload = await response.json();
    setQuestions((current) => [...current, payload.question]);
    setSelected((current) => [...current, payload.question.id]);
    setNewQuestion("");
  }

  async function save() {
    await fetch(`/api/rooms/${roomCode}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds: selected }),
    });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-200 p-5">
          <div>
            <p className="text-sm font-bold uppercase text-rose-600">Banco de perguntas</p>
            <h2 className="text-2xl font-black text-zinc-950">Escolher perguntas</h2>
          </div>
          <button onClick={onClose} className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-bold text-zinc-950">X</button>
        </header>
        <div className="max-h-[56vh] space-y-3 overflow-y-auto p-5">
          {questions.map((question) => (
            <label key={question.id} className="flex gap-3 rounded-lg border border-zinc-200 p-3">
              <input
                type="checkbox"
                checked={selected.includes(question.id)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked ? [...current, question.id] : current.filter((id) => id !== question.id),
                  )
                }
                className="mt-1 h-5 w-5 accent-rose-600"
              />
              <span className="font-medium text-zinc-800">{question.question}</span>
            </label>
          ))}
        </div>
        <footer className="space-y-3 border-t border-zinc-200 p-5">
          <div className="flex gap-2">
            <input
              value={newQuestion}
              onChange={(event) => setNewQuestion(event.target.value)}
              placeholder="Adicionar pergunta nova"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 placeholder:text-zinc-400"
            />
            <button onClick={addQuestion} className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-bold text-zinc-950">
              Adicionar
            </button>
          </div>
          <button onClick={save} className="w-full rounded-md bg-rose-600 px-4 py-3 font-black text-white">
            Salvar selecao
          </button>
        </footer>
      </div>
    </div>
  );
}
