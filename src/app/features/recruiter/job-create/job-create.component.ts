import { Component, inject, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { tunisianCities } from '../../../shared/data/tunisian-cities'; // Point vers le fichier peuplé
import { environment } from '../../../../environments/environment';
import { QuizBuilderComponent, QuizQuestionDraft } from '../../../shared/components/quiz-builder/quiz-builder.component';
import { createEmptyQuestion } from '../../../shared/constants/quiz.constants';

@Component({
  selector: 'app-job-create',
  standalone: true,
  imports: [FormsModule, CommonModule, NgClass, QuizBuilderComponent],
  templateUrl: './job-create.component.html',
  styleUrls: ['./job-create.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class JobCreateComponent {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  };

  job = {
    title: '',
    contract_type: 'CDI',
    location: '',
    workplace_type: 'Présentiel',
    salary: '',
    experience_level: 'Junior (0-2 ans)',
    missions_desc: '',
    profile_desc: '',
    skills_desc: '',
    languages_desc: '',
    expires_at: '',
  };

  hasQuiz = false;
  quizSaved = false;
  showQuizModal = false;
  quizTitle = 'Quiz de présélection';
  quizQuestions: QuizQuestionDraft[] = [];

  // Autocomplétion Localisation
  filteredLocations: { ville: string; cite: string }[] = [];
  showLocationSuggestions: boolean = false;

  showFlashMessage(message: string, type: 'success' | 'error', callback?: () => void) {
    this.notification = { show: true, message, type };
    this.cdr.detectChanges();
    setTimeout(() => {
      this.notification.show = false;
      this.cdr.detectChanges();
      if (callback) callback();
    }, 3000);
  }

  getSkillsArray(): string[] {
    if (!this.job.skills_desc) return [];
    return this.job.skills_desc.split(',').map((s) => s.trim()).filter(Boolean);
  }

  getLanguagesArray(): string[] {
    if (!this.job.languages_desc) return [];
    return this.job.languages_desc.split(',').map((s) => s.trim()).filter(Boolean);
  }

  onOpenQuizModal() {
    this.hasQuiz = true;
    this.quizSaved = false;
    if (!this.quizQuestions.length) {
      this.quizQuestions = [createEmptyQuestion()];
    }
    this.showQuizModal = true;
    this.cdr.detectChanges();
  }

  onCloseQuizModal() {
    this.showQuizModal = false;
    if (!this.quizSaved) {
      this.hasQuiz = false;
      this.quizQuestions = [];
    }
    this.cdr.detectChanges();
  }

  onEditQuiz() {
    this.showQuizModal = true;
    this.cdr.detectChanges();
  }

  onDisableQuiz() {
    this.hasQuiz = false;
    this.quizSaved = false;
    this.quizQuestions = [];
    this.showQuizModal = false;
    this.cdr.detectChanges();
  }

  onQuizQuestionsChange(questions: QuizQuestionDraft[]) {
    this.quizQuestions = questions;
    this.quizSaved = false;
    this.cdr.detectChanges();
  }

  onQuizTitleChange(title: string) {
    this.quizTitle = title;
    this.quizSaved = false;
    this.cdr.detectChanges();
  }

  onSaveQuizDraft() {
    const err = this.validateQuizLocal();
    if (err) {
      this.showFlashMessage(err, 'error');
      return;
    }
    this.quizSaved = true;
    this.showQuizModal = false;
    this.showFlashMessage('Quiz enregistré. Vous pouvez maintenant diffuser l\'annonce.', 'success');
    this.cdr.detectChanges();
  }

  get canPublishJob(): boolean {
    if (!this.hasQuiz) return true;
    return this.quizSaved;
  }

  onPublish(event: Event) {
    event.preventDefault();

    if (
      !this.job.title ||
      !this.job.location ||
      !this.job.missions_desc ||
      !this.job.profile_desc ||
      !this.job.skills_desc ||
      !this.job.languages_desc
    ) {
      this.showFlashMessage("Veuillez renseigner tous les champs obligatoires (*).", 'error');
      return;
    }

    if (this.hasQuiz && !this.quizSaved) {
      this.showFlashMessage('Enregistrez le quiz avant de diffuser l\'annonce.', 'error');
      return;
    }

    if (this.hasQuiz) {
      const err = this.validateQuizLocal();
      if (err) {
        this.showFlashMessage(err, 'error');
        return;
      }
    }

    const payload: any = { ...this.job, has_quiz: this.hasQuiz };
    if (this.hasQuiz) {
      payload.quiz = {
        title: this.quizTitle.trim() || 'Quiz de présélection',
        questions: this.quizQuestions.map((q) => ({
          question_text: q.question_text.trim(),
          question_type: 'single',
          choices: q.choices.map((c) => ({
            choice_text: c.choice_text.trim(),
            is_correct: !!c.is_correct,
          })),
        })),
      };
    }

    this.http.post(`${environment.apiUrl}/recruiter/jobs/create`, payload).subscribe({
      next: (res: any) => {
        this.showFlashMessage(res.message || "Annonce diffusée avec succès !", 'success', () =>
          this.router.navigate(['/recruiter/job-manage'])
        );
      },
      error: (err) => {
        const msg = err.error?.message || err.error?.errors?.join(' ') || "Impossible de diffuser l'offre.";
        this.showFlashMessage(msg, 'error');
      },
    });
  }

  private validateQuizLocal(): string | null {
    if (!this.quizQuestions.length) return 'Ajoutez au moins une question.';
    for (let i = 0; i < this.quizQuestions.length; i++) {
      const q = this.quizQuestions[i];
      if (!q.question_text.trim()) return `La question ${i + 1} est vide.`;
      if (q.choices.filter((c) => c.choice_text.trim()).length < 3) {
        return `La question ${i + 1} doit avoir 3 réponses.`;
      }
      if (!q.choices.some((c) => c.is_correct)) {
        return `Indiquez la bonne réponse (question ${i + 1}).`;
      }
    }
    return null;
  }

  // ============================================================================
  // 🚀 AUTOCOMPLÉTION LOCALISATION
  // ============================================================================

  onLocationInput(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    if (searchTerm.length > 0) {
      this.filteredLocations = (tunisianCities as { ville: string; cite: string }[]).filter(
        (loc: { ville: string; cite: string }) => loc.ville.toLowerCase().startsWith(searchTerm) || loc.cite.toLowerCase().startsWith(searchTerm)
      );
      this.showLocationSuggestions = this.filteredLocations.length > 0;
    } else {
      this.filteredLocations = [];
      this.showLocationSuggestions = false;
    }
  }

  selectLocation(location: { ville: string; cite: string }) {
    this.job.location = `${location.ville}, ${location.cite}`;
    this.showLocationSuggestions = false;
  }

  onLocationBlur() {
    // Utiliser un petit délai pour permettre le clic sur une suggestion avant de cacher
    setTimeout(() => { this.showLocationSuggestions = false; }, 150);
  }
}
