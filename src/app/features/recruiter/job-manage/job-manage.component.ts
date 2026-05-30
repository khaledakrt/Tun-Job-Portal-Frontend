import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { QuizService } from '../../../core/services/quiz.service';
import {
  QuizBuilderComponent,
  QuizQuestionDraft,
} from '../../../shared/components/quiz-builder/quiz-builder.component';
import { createEmptyQuestion } from '../../../shared/constants/quiz.constants';

@Component({
  selector: 'app-job-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, QuizBuilderComponent],
  templateUrl: './job-manage.component.html',
  styleUrls: ['./job-manage.component.css'],
})
export class JobManageComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private quizService = inject(QuizService);

  jobsList: any[] = [];
  isLoading = true;
  selectedJob: any = null;

  quizManageJob: any = null;
  hasQuizEdit = false;
  quizTitle = 'Quiz de présélection';
  quizQuestions: QuizQuestionDraft[] = [];
  quizIsActive = true;
  isSavingQuiz = false;
  quizMessage = '';

  recruiterStats = {
    totalApplications: 0,
    todayApplications: 0,
    plannedInterviews: 0,
    conversionRate: 0,
    conversionEvolution: 0,
  };

  searchText = '';
  currentPage = 1;
  pageSize = 8;

  ngOnInit() {
    this.fetchRecruiterJobs();
    this.fetchDashboardStats();
  }

  fetchRecruiterJobs() {
    this.http.get<any[]>(`${environment.apiUrl}/recruiter/jobs/list`).subscribe({
      next: (data) => {
        this.jobsList = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  fetchDashboardStats() {
    this.http.get<any>(`${environment.apiUrl}/recruiter/stats`).subscribe({
      next: (data) => {
        this.recruiterStats.totalApplications = data.applicationsCount || 0;
        this.recruiterStats.plannedInterviews = data.interviewsCount || 0;
        this.recruiterStats.conversionRate = data.conversionRate || 0;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredJobs() {
    return this.jobsList.filter(
      (job) =>
        job.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
        job.location.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  get paginatedJobs() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredJobs.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredJobs.length / this.pageSize) || 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  onViewJob(job: any) {
    this.selectedJob = job;
    this.cdr.detectChanges();
  }

  onCloseModal() {
    this.selectedJob = null;
    this.cdr.detectChanges();
  }

  onManageQuiz(job: any) {
    this.quizManageJob = job;
    this.quizMessage = '';
    this.hasQuizEdit = !!job.has_quiz;
    this.quizIsActive = job.quiz_is_active !== 0 && job.quiz_is_active !== false;
    this.quizTitle = job.quiz_title || 'Quiz de présélection';
    this.quizQuestions = [];

    if (job.has_quiz) {
      this.quizService.getRecruiterQuiz(job.id).subscribe({
        next: (quiz) => {
          this.quizTitle = quiz.title || this.quizTitle;
          this.quizIsActive = quiz.is_active !== 0;
          this.quizQuestions = (quiz.questions || []).map((q: any) => ({
            question_text: q.question_text,
            question_type: 'single' as const,
            choices: (q.choices || []).slice(0, 3).map((c: any) => ({
              choice_text: c.choice_text,
              is_correct: !!c.is_correct,
            })),
          }));
          while (this.quizQuestions.length < 1 && this.hasQuizEdit) {
            this.quizQuestions.push(createEmptyQuestion());
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.quizQuestions = [createEmptyQuestion()];
          this.cdr.detectChanges();
        },
      });
    } else {
      this.quizQuestions = [createEmptyQuestion()];
      this.cdr.detectChanges();
    }
  }

  onCloseQuizModal() {
    this.quizManageJob = null;
    this.cdr.detectChanges();
  }

  onQuizEnabledChange(enabled: boolean) {
    this.hasQuizEdit = enabled;
    if (enabled && !this.quizQuestions.length) {
      this.quizQuestions = [createEmptyQuestion()];
    }
    this.cdr.detectChanges();
  }

  saveQuiz() {
    if (!this.quizManageJob) return;
    if (!this.hasQuizEdit) {
      if (this.quizManageJob.has_quiz) {
        this.quizService.deleteQuizForJob(this.quizManageJob.id).subscribe({
          next: () => {
            this.quizMessage = 'Quiz supprimé.';
            this.fetchRecruiterJobs();
            this.onCloseQuizModal();
          },
        });
      }
      return;
    }

    const err = this.validateQuiz();
    if (err) {
      this.quizMessage = err;
      this.cdr.detectChanges();
      return;
    }

    this.isSavingQuiz = true;
    const payload = {
      title: this.quizTitle.trim(),
      questions: this.quizQuestions.map((q) => ({
        question_text: q.question_text.trim(),
        question_type: 'single',
        choices: q.choices.map((c) => ({
          choice_text: c.choice_text.trim(),
          is_correct: !!c.is_correct,
        })),
      })),
    };

    this.quizService.saveQuizForJob(this.quizManageJob.id, payload).subscribe({
      next: () => {
        this.isSavingQuiz = false;
        this.quizMessage = 'Quiz enregistré.';
        this.fetchRecruiterJobs();
        this.cdr.detectChanges();
        setTimeout(() => this.onCloseQuizModal(), 1200);
      },
      error: (e) => {
        this.isSavingQuiz = false;
        this.quizMessage = e.error?.message || 'Erreur enregistrement.';
        this.cdr.detectChanges();
      },
    });
  }

  toggleQuizVisibility(visible: boolean) {
    if (!this.quizManageJob?.has_quiz) return;
    this.quizService.setQuizVisibility(this.quizManageJob.id, visible).subscribe({
      next: (res) => {
        this.quizIsActive = visible;
        this.quizManageJob.quiz_is_active = visible ? 1 : 0;
        this.quizMessage = res.message;
        this.fetchRecruiterJobs();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.quizMessage = e.error?.message || 'Erreur.';
        this.cdr.detectChanges();
      },
    });
  }

  private validateQuiz(): string | null {
    if (!this.quizQuestions.length) return 'Ajoutez au moins une question.';
    for (let i = 0; i < this.quizQuestions.length; i++) {
      const q = this.quizQuestions[i];
      if (!q.question_text.trim()) return `Question ${i + 1} vide.`;
      if (q.choices.filter((c) => c.choice_text.trim()).length < 3) {
        return `Question ${i + 1} : 3 réponses requises.`;
      }
      if (!q.choices.some((c) => c.is_correct)) {
        return `Question ${i + 1} : indiquez la bonne réponse.`;
      }
    }
    return null;
  }

  onToggleStatus(job: any) {
    this.http
      .post(`${environment.apiUrl}/recruiter/jobs/toggle-status`, { jobId: job.id })
      .subscribe({
        next: () => {
          job.status = job.status === 'disponible' ? 'fermé' : 'disponible';
          this.cdr.detectChanges();
        },
        error: () => alert('Erreur statut.'),
      });
  }

  onDeleteJob(jobId: number) {
    if (!confirm('Supprimer cette annonce ?')) return;
    this.http.delete(`${environment.apiUrl}/recruiter/jobs/delete/${jobId}`).subscribe({
      next: () => {
        this.jobsList = this.jobsList.filter((j) => j.id !== jobId);
        this.currentPage = 1;
        this.cdr.detectChanges();
      },
    });
  }

  getJobSkillsArray(skillsText: string): string[] {
    if (!skillsText) return [];
    return skillsText.split(',').map((s) => s.trim()).filter(Boolean);
  }

  getJobLanguagesArray(langText: string): string[] {
    if (!langText) return [];
    return langText.split(',').map((s) => s.trim()).filter(Boolean);
  }

  getQuizBadge(job: any): string {
    if (!job.has_quiz) return 'Aucun';
    return job.quiz_is_active ? 'Actif' : 'Masqué';
  }
}
