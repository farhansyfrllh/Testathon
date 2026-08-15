import { create } from 'zustand';
interface QuizState {
  currentModuleId: string | null;
  answers: Record<string, string[]>;
  // dragDropAnswers keyed as "questionId::slotId" -> optionId
  // e.g. { "qid1::0": "optId3", "qid1::1": "optId5" }
  dragDropAnswers: Record<string, string>;
  xp: number; questionCount: number; correctCount: number;
  setCurrentModule: (id: string) => void;
  setAnswer: (qId: string, optionIds: string[]) => void;
  // setDragDrop: keyed by "questionId::slotId"
  setDragDrop: (questionId: string, slotId: string, componentId: string) => void;
  // get all slot mappings for a specific question: returns { slotId: optionId }
  getDragDropMappingForQuestion: (questionId: string) => Record<string, string>;
  addXp: (n: number) => void;
  incrementCorrect: () => void;
  resetQuiz: () => void;
}
export const useQuizStore = create<QuizState>((set, get) => ({
  currentModuleId: null, answers: {}, dragDropAnswers: {}, xp: 0, questionCount: 0, correctCount: 0,
  setCurrentModule: (id) => set({ currentModuleId: id }),
  setAnswer: (qId, ids) => set((s) => ({ answers: { ...s.answers, [qId]: ids } })),
  setDragDrop: (questionId, slotId, cId) => {
    const key = `${questionId}::${slotId}`;
    set((s) => ({ dragDropAnswers: { ...s.dragDropAnswers, [key]: cId } }));
  },
  getDragDropMappingForQuestion: (questionId) => {
    const prefix = `${questionId}::`;
    const result: Record<string, string> = {};
    const all = get().dragDropAnswers;
    for (const [key, val] of Object.entries(all)) {
      if (key.startsWith(prefix)) {
        const slotId = key.slice(prefix.length);
        result[slotId] = val;
      }
    }
    return result;
  },
  addXp: (n) => set((s) => ({ xp: s.xp + n })),
  incrementCorrect: () => set((s) => ({ correctCount: s.correctCount + 1 })),
  resetQuiz: () => set({ currentModuleId: null, answers: {}, dragDropAnswers: {}, xp: 0, questionCount: 0, correctCount: 0 }),
}));
