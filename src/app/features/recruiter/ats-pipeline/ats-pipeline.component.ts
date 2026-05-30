import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { QuizService } from '../../../core/services/quiz.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-ats-pipeline',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule],
  templateUrl: './ats-pipeline.component.html',
  styleUrls: ['./ats-pipeline.component.css'],
})
export class AtsPipelineComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private quizService = inject(QuizService);
  private notificationService = inject(NotificationService);
  private notifSub: Subscription | null = null;

  applicationsList: any[] = [];
  selectedApplication: any = null;

  isQuizAccordionOpen = false;
  quizAnswersData: {
    has_quiz: boolean;
    quiz_title: string | null;
    answers: any[];
  } | null = null;
  isLoadingQuizAnswers = false;

  selectedJobTitle: string = 'all';
  searchTerm: string = '';
  pageSize: number = 5;
  pageNumbers: { [status: string]: number } = {
    'Nouveau': 1,
    'Entretien': 1,
    'Proposition': 1
  };

  ngOnInit() {
    this.fetchApplications();
    // S'abonner aux notifications qui demandent l'ouverture d'une candidature
    this.notifSub = this.notificationService.openApplication$.subscribe((payload: any) => {
      if (!payload) return;
      
      this.isQuizAccordionOpen = false; // Ferme l'accordéon lors d'une ouverture via notification

      // Si le service envoie un identifiant d'application
      if (typeof payload === 'number' || (payload && payload.id && typeof payload.id === 'number')) {
        const appId = typeof payload === 'number' ? payload : payload.id;
        const found = this.applicationsList.find(a => a.id === appId);
        if (found) {
          this.onSelectApplication(found);
        } else {
          // fallback : récupérer le profil via API si absent localement
          this.http.get<any>(`${environment.apiUrl}/recruiter/candidate-profile/${appId}`).subscribe({
            next: (data) => { if (data) { this.selectedApplication = data; this.cdr.detectChanges(); } },
            error: () => {}
          });
        }
      } else if (typeof payload === 'object') {
        // Si on reçoit directement l'objet candidat enrichi depuis la cloche
        this.selectedApplication = { ...payload };
        // Charger les réponses quiz si on a un application_id
        const applicationId = payload.application_id || payload.id || null;
        if (applicationId) {
          this.isLoadingQuizAnswers = true;
          this.quizService.getApplicationQuizAnswers(applicationId).subscribe({
            next: (data) => { this.quizAnswersData = data; this.isLoadingQuizAnswers = false; this.cdr.detectChanges(); },
            error: () => { this.quizAnswersData = { has_quiz: false, quiz_title: null, answers: [] }; this.isLoadingQuizAnswers = false; this.cdr.detectChanges(); }
          });
        }
        this.cdr.detectChanges();
      }
    });
  }

  fetchApplications() {
    this.http
      .get<{ applications: any[] }>(`${environment.apiUrl}/recruiter/ats/applications`)
      .subscribe({
        next: (data) => {
          this.applicationsList =
            data && Array.isArray(data.applications) ? data.applications : [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur ATS :', err),
      });
  }

  getFilteredCandidatesCount(jobTitle: string): number {
    return this.applicationsList.filter((app) => {
      if (jobTitle !== 'all' && app.job_title !== jobTitle) return false;
      if (!app.status) return true;
      const currentStatus = app.status.toLowerCase().trim();
      return (
        currentStatus.includes('nouv') ||
        currentStatus.includes('att') ||
        currentStatus === 'pending' ||
        currentStatus.includes('entre') ||
        currentStatus.includes('tech') ||
        currentStatus.includes('prop') ||
        currentStatus.includes('offr')
      );
    }).length;
  }

  getUniqueJobTitles(): string[] {
    if (!this.applicationsList) return [];

    const visibleApps = this.applicationsList.filter((app) => {
      if (!app.status) return true;
      const currentStatus = app.status.toLowerCase().trim();
      return (
        currentStatus.includes('nouv') ||
        currentStatus.includes('att') ||
        currentStatus === 'pending' ||
        currentStatus.includes('entre') ||
        currentStatus.includes('tech') ||
        currentStatus.includes('prop') ||
        currentStatus.includes('offr')
      );
    });

    const titles = visibleApps.map((app) => app.job_title).filter((title) => !!title);
    return [...new Set(titles)];
  }

  onJobFilterChange(event: any) {
    this.selectedJobTitle = event.target.value;
    this.resetPagination();
    this.cdr.detectChanges();
  }
  onSearchTermChange(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.resetPagination(); // On repart à la page 1 lors d'une recherche
    this.cdr.detectChanges();
  }
  resetFilters() {
    this.searchTerm = '';
    this.selectedJobTitle = 'all';
    this.resetPagination();
    this.cdr.detectChanges();
  }

  resetPagination() {
    this.pageNumbers = {
      'Nouveau': 1,
      'Entretien': 1,
      'Proposition': 1
    };
  }

  changeCandidateStatus(applicationId: number, newStatus: string) {
    this.http
      .post(`${environment.apiUrl}/recruiter/ats/update-status`, {
        id: applicationId,
        status: newStatus,
      })
      .subscribe({
        next: () => {
          const appIndex = this.applicationsList.findIndex((a) => a.id === applicationId);
          if (appIndex !== -1) {
            this.applicationsList[appIndex].status = newStatus;
          }
          this.onCloseDetails();
        },
        error: () => alert('Impossible de modifier le statut.'),
      });
  }
  private filterApplication(app: any, statusName: string): boolean {
    // 1. Filtrage par titre d'offre
    if (this.selectedJobTitle !== 'all' && app.job_title !== this.selectedJobTitle) {
      return false;
    }

    // 2. Filtrage par statut
    let statusMatch = false;
    if (!app.status) {
      statusMatch = statusName === 'Nouveau';
    } else {
      const currentStatus = app.status.toLowerCase().trim();
      if (statusName === 'Nouveau') {
        statusMatch = currentStatus.includes('nouv') || currentStatus.includes('att') || currentStatus === 'pending';
      } else if (statusName === 'Entretien') {
        statusMatch = currentStatus.includes('entre') || currentStatus.includes('tech');
      } else if (statusName === 'Proposition') {
        statusMatch = currentStatus.includes('prop') || currentStatus.includes('offr');
      }
    }
    if (!statusMatch) return false;

    // 3. Filtrage par terme de recherche (Nom, Poste ou Ville)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      return (
        (app.name && app.name.toLowerCase().includes(term)) ||
        (app.job_title && app.job_title.toLowerCase().includes(term)) ||
        (app.address && app.address.toLowerCase().includes(term))
      );
    }

    return true;
  }

  getCandidatesByStatus(statusName: string): any[] {
    const filtered = this.applicationsList.filter(app => this.filterApplication(app, statusName));
    const currentPage = this.pageNumbers[statusName] || 1;
    return filtered.slice(0, currentPage * this.pageSize);
  }

  getTotalCandidatesForStatus(statusName: string): number {
    return this.applicationsList.filter(app => this.filterApplication(app, statusName)).length;
  }

  loadMoreCandidates(statusName: string) {
    this.pageNumbers[statusName]++;
    this.cdr.detectChanges();
  }

  hasMoreCandidates(statusName: string): boolean {
    const totalFiltered = this.getTotalCandidatesForStatus(statusName);
    const loadedCount = (this.pageNumbers[statusName] || 1) * this.pageSize;
    return loadedCount < totalFiltered;
  }

  onSelectApplication(app: any) {
    this.selectedApplication = { ...app };
    this.isQuizAccordionOpen = false; // Ferme l'accordéon par défaut pour le nouveau candidat
    this.quizAnswersData = null;
    this.isLoadingQuizAnswers = true;
    this.cdr.detectChanges();

    this.quizService.getApplicationQuizAnswers(app.id).subscribe({
      next: (data) => {
        this.quizAnswersData = data;
        this.isLoadingQuizAnswers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.quizAnswersData = { has_quiz: false, quiz_title: null, answers: [] };
        this.isLoadingQuizAnswers = false;
        this.cdr.detectChanges();
      },
    });
  }

  onCloseDetails() {
    this.selectedApplication = null;
    this.isQuizAccordionOpen = false;
    this.quizAnswersData = null;
    this.isLoadingQuizAnswers = false;
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.notifSub) this.notifSub.unsubscribe();
  }

  openCandidateCV(candidateId: number) {
    if (!candidateId) return;
    window.open(`/candidate/cv-view/${candidateId}`, '_blank');
  }

  logoUrl(filename: string | null): string {
    if (!filename) return 'assets/images/default-avatar.png';
    const clean = filename.replace('/logos/', '').replace('uploads/logos/', '').replace('/uploads/logos/', '');
    return `${environment.assetsUrl}/logos/${clean}`;
  }
}
