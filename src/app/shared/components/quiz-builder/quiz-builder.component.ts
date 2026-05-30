import { Component, Input, Output, EventEmitter, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import {
  QUIZ_MAX_QUESTIONS,
  QUIZ_CHOICES_PER_QUESTION,
  createEmptyQuestion,
} from '../../constants/quiz.constants';

export interface QuizChoiceDraft {
  choice_text: string;
  is_correct: boolean;
}

export interface QuizQuestionDraft {
  question_text: string;
  question_type: 'single';
  choices: QuizChoiceDraft[];
}

@Component({
  selector: 'app-quiz-builder',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './quiz-builder.component.html',
  styleUrls: ['./quiz-builder.component.css'],
})
export class QuizBuilderComponent {
  private cdr = inject(ChangeDetectorRef);

  @Input() enabled = false;
  @Input() quizTitle = 'Quiz de présélection';
  @Input() questions: QuizQuestionDraft[] = [];
  @Input() isActive = true;
  @Input() showManageActions = false;
  @Input() showSaveButton = false;
  @Input() hideActivationToggle = false;
  @Input() isSaving = false;

  @Output() enabledChange = new EventEmitter<boolean>();
  @Output() quizTitleChange = new EventEmitter<string>();
  @Output() questionsChange = new EventEmitter<QuizQuestionDraft[]>();
  @Output() isActiveChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<void>();
  @Output() toggleVisibility = new EventEmitter<boolean>();

  readonly maxQuestions = QUIZ_MAX_QUESTIONS;
  readonly choicesCount = QUIZ_CHOICES_PER_QUESTION;

  onToggleEnabled(checked: boolean) {
    this.enabledChange.emit(checked);
    if (checked && this.questions.length === 0) {
      this.addQuestion();
    }
    this.cdr.detectChanges();
  }

  addQuestion() {
    if (this.questions.length >= QUIZ_MAX_QUESTIONS) return;
    const next = [...this.questions, createEmptyQuestion()];
    this.questionsChange.emit(next);
    this.cdr.detectChanges();
  }

  removeQuestion(index: number) {
    if (this.questions.length <= 1) return;
    const next = this.questions.filter((_, i) => i !== index);
    this.questionsChange.emit(next);
    this.cdr.detectChanges();
  }

  setCorrectChoice(qIndex: number, cIndex: number) {
    const next = this.questions.map((q, qi) => {
      if (qi !== qIndex) return q;
      return {
        ...q,
        choices: q.choices.map((c, ci) => ({ ...c, is_correct: ci === cIndex })),
      };
    });
    this.questionsChange.emit(next);
    this.cdr.detectChanges();
  }

  updateTitle(value: string) {
    this.quizTitleChange.emit(value);
  }

  validate(): string | null {
    if (!this.enabled) return null;
    if (!this.questions.length) return 'Ajoutez au moins une question.';
    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i];
      if (!q.question_text.trim()) return `La question ${i + 1} est vide.`;
      const filled = q.choices.filter((c) => c.choice_text.trim());
      if (filled.length < QUIZ_CHOICES_PER_QUESTION) {
        return `La question ${i + 1} doit avoir 3 réponses.`;
      }
      if (!q.choices.some((c) => c.is_correct)) {
        return `Indiquez la bonne réponse pour la question ${i + 1}.`;
      }
    }
    return null;
  }

  buildPayload() {
    return {
      title: this.quizTitle.trim() || 'Quiz de présélection',
      questions: this.questions.map((q) => ({
        question_text: q.question_text.trim(),
        question_type: 'single' as const,
        choices: q.choices.map((c) => ({
          choice_text: c.choice_text.trim(),
          is_correct: !!c.is_correct,
        })),
      })),
    };
  }
}
