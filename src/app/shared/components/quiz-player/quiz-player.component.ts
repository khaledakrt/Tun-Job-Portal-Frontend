import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-player.component.html',
  styleUrls: ['./quiz-player.component.css'],
})
export class QuizPlayerComponent {
  @Input() quiz: { title?: string; questions?: any[] } | null = null;
  @Input() loading = false;
  @Input() answers: Record<number, number> = {};

  @Output() answerChange = new EventEmitter<{ questionId: number; choiceId: number }>();

  get answeredCount(): number {
    if (!this.quiz?.questions) return 0;
    return this.quiz.questions.filter((q) => this.answers[q.id]).length;
  }

  get totalQuestions(): number {
    return this.quiz?.questions?.length || 0;
  }

  selectAnswer(questionId: number, choiceId: number) {
    this.answerChange.emit({ questionId, choiceId });
  }

  isSelected(questionId: number, choiceId: number): boolean {
    return this.answers[questionId] === choiceId;
  }

  choiceLetter(index: number): string {
    return ['A', 'B', 'C'][index] || '?';
  }
}
