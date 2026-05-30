import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApplicationService, QuizAnswerPayload } from '../../../core/services/application.service';
import { QuizService } from '../../../core/services/quiz.service';
import { environment } from '../../../../environments/environment';
import { QuizPlayerComponent } from '../../../shared/components/quiz-player/quiz-player.component';

@Component({
  selector: 'app-job-search',
  standalone: true,
  imports: [CommonModule, FormsModule, QuizPlayerComponent],
  templateUrl: './job-search.component.html',
  styleUrls: ['./job-search.component.css'],
})
export class JobSearchComponent implements OnInit {
  readonly environment = environment;
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private http = inject(HttpClient);
  private applicationService = inject(ApplicationService);
  private quizService = inject(QuizService);

  allJobs: any[] = [];
  isLoading = true;
  selectedJob: any = null;
  selectedRecruiter: any = null;

  showConfirmApplyPopup = false;
  applyPopupSuccess = false;
  jobToApply: any = null;
  showAuthRequiredPopup = false;

  jobQuiz: any = null;
  quizAnswers: Record<number, number> = {};
  isLoadingQuiz = false;
  applyError = '';
  isSubmitting = false;

  searchFilters = { title: '', location: '', experience: '', contract: '' };
  isLoggedIn = false;

  ngOnInit() {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.fetchAvailableJobs();
  }

  fetchAvailableJobs() {
    const token = localStorage.getItem('token');

    const jobsPromise = this.http
      .get<any>(`${environment.apiUrl}/candidate/jobs/list`)
      .toPromise();

    let historyPromise: Promise<any> = Promise.resolve({ history: [] });
    if (token) {
      historyPromise = this.applicationService
        .getHistory()
        .toPromise()
        .catch(() => ({ history: [] }));
    }

    Promise.all([jobsPromise, historyPromise])
      .then(([jobsData, historyData]) => {
        const jobsList = Array.isArray(jobsData) ? jobsData : jobsData?.jobs || [];
        const historyList = historyData?.history || [];
        const appliedJobIds = historyList.map((app: any) => app.job_id);

        this.allJobs = jobsList.map((job: any) => ({
          ...job,
          has_quiz: !!job.has_quiz,
          isAlreadyApplied: token ? appliedJobIds.includes(job.id) : false,
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  loadQuizForJob(jobId: number) {
    const token = localStorage.getItem('token');
    this.isLoadingQuiz = true;
    this.jobQuiz = null;
    this.quizAnswers = {};
    this.quizService.getQuizForJob(jobId, !token).subscribe({
      next: (res) => {
        this.jobQuiz = res.has_quiz ? res.quiz : null;
        this.isLoadingQuiz = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingQuiz = false;
        this.jobQuiz = null;
        this.cdr.detectChanges();
      },
    });
  }

  onViewRecruiterProfile(recruiterId: number) {
    if (!recruiterId) return;
    this.http
      .get(`${environment.apiUrl}/candidate/profile/details-public/${recruiterId}`)
      .subscribe({
        next: (data) => {
          this.selectedRecruiter = data;
          this.cdr.detectChanges();
        },
        error: () => alert("Impossible de charger la fiche de cette entreprise."),
      });
  }

  getSearchJobSkillsArray(skillsText: string): string[] {
    if (!skillsText) return [];
    return skillsText.split(',').map((s) => s.trim()).filter(Boolean);
  }

  getSearchJobLanguagesArray(langText: string): string[] {
    if (!langText) return [];
    return langText.split(',').map((s) => s.trim()).filter(Boolean);
  }

  onCloseRecruiterModal() {
    this.selectedRecruiter = null;
    this.cdr.detectChanges();
  }

  get filteredJobs() {
    return this.allJobs.filter((job) => {
      const matchTitle =
        !this.searchFilters.title.trim() ||
        job.title?.toLowerCase().includes(this.searchFilters.title.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(this.searchFilters.title.toLowerCase());
      const matchLocation =
        !this.searchFilters.location.trim() ||
        job.location?.toLowerCase().includes(this.searchFilters.location.toLowerCase());
      const matchExperience =
        !this.searchFilters.experience || job.experience_level === this.searchFilters.experience;
      const matchContract =
        !this.searchFilters.contract || job.contract_type === this.searchFilters.contract;
      return matchTitle && matchLocation && matchExperience && matchContract;
    });
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.searchFilters.title.trim() ||
      this.searchFilters.location.trim() ||
      this.searchFilters.experience ||
      this.searchFilters.contract
    );
  }

  onResetFilters() {
    this.searchFilters = { title: '', location: '', experience: '', contract: '' };
    this.cdr.detectChanges();
  }

  onViewJobDetails(job: any) {
    this.selectedJob = job;
    this.applyError = '';
    if (job.has_quiz) {
      this.loadQuizForJob(job.id);
    } else {
      this.jobQuiz = null;
      this.quizAnswers = {};
    }
    this.cdr.detectChanges();
  }

  onCloseModal() {
    this.selectedJob = null;
    this.jobQuiz = null;
    this.quizAnswers = {};
    this.applyError = '';
    this.cdr.detectChanges();
  }

  onOpenApplyModal(job: any) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.showAuthRequiredPopup = true;
      this.cdr.detectChanges();
      return;
    }

    if (job.has_quiz) {
      this.onViewJobDetails(job);
      return;
    }

    this.jobToApply = job;
    this.showConfirmApplyPopup = true;
    this.cdr.detectChanges();
  }

  goToLogin() {
    this.showAuthRequiredPopup = false;
    this.router.navigate(['/login']);
  }

  onQuizAnswerChange(event: { questionId: number; choiceId: number }) {
    this.quizAnswers[event.questionId] = event.choiceId;
    this.cdr.detectChanges();
  }

  private buildQuizAnswers(): QuizAnswerPayload[] {
    return Object.entries(this.quizAnswers).map(([questionId, choiceId]) => ({
      question_id: Number(questionId),
      choice_id: Number(choiceId),
    }));
  }

  canSubmitApply(): boolean {
    const job = this.selectedJob || this.jobToApply;
    if (!job) return false;
    if (!job.has_quiz || !this.jobQuiz?.questions?.length) return true;
    return this.jobQuiz.questions.every((q: any) => this.quizAnswers[q.id]);
  }

  onRequestApplyConfirmation() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.showAuthRequiredPopup = true;
      this.cdr.detectChanges();
      return;
    }

    const job = this.selectedJob || this.jobToApply;
    if (!job) return;

    if (!this.canSubmitApply()) {
      this.applyError = 'Veuillez répondre à toutes les questions du quiz.';
      this.cdr.detectChanges();
      return;
    }

    this.jobToApply = job;
    this.applyError = '';
    this.applyPopupSuccess = false;
    this.showConfirmApplyPopup = true;
    this.cdr.detectChanges();
  }

  onCancelApplyConfirmation() {
    this.showConfirmApplyPopup = false;
    this.applyPopupSuccess = false;
    this.applyError = '';
    if (!this.selectedJob) {
      this.jobToApply = null;
    }
    this.cdr.detectChanges();
  }

  executeApplySubmit() {
    const job = this.selectedJob || this.jobToApply;
    if (!job || !this.canSubmitApply()) {
      this.applyError = 'Veuillez répondre à toutes les questions du quiz.';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.applyError = '';
    const answers = job.has_quiz ? this.buildQuizAnswers() : [];

    this.applicationService.applyToJob(job.id, answers).subscribe({
      next: () => {
        job.isAlreadyApplied = true;
        const inList = this.allJobs.find((j) => j.id === job.id);
        if (inList) inList.isAlreadyApplied = true;
        this.isSubmitting = false;
        this.applyPopupSuccess = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showConfirmApplyPopup = false;
          this.applyPopupSuccess = false;
          this.jobToApply = null;
          this.onCloseModal();
          this.cdr.detectChanges();
        }, 2200);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.applyError = err.error?.message || 'Erreur lors de la transmission.';
        this.cdr.detectChanges();
      },
    });
  }
}
