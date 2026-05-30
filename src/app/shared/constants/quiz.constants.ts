export const QUIZ_MAX_QUESTIONS = 5;
export const QUIZ_CHOICES_PER_QUESTION = 3;

export function createEmptyQuestion() {
  return {
    question_text: '',
    question_type: 'single' as const,
    choices: [
      { choice_text: '', is_correct: true },
      { choice_text: '', is_correct: false },
      { choice_text: '', is_correct: false },
    ],
  };
}
