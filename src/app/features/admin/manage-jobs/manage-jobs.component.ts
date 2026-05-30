import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-manage-jobs',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule],
  templateUrl: './manage-jobs.component.html',
  styleUrls: ['./manage-jobs.component.css']
})
export class ManageJobsComponent implements OnInit {
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);
  readonly assetsUrl = environment.assetsUrl;

  jobsList: any[] = [];
  isLoading = false;
  searchTerm = '';
  selectedJob: any = null;
  showJobCard = false;
  isJobEditMode = false;
  jobEditData: any = {};

  get filteredJobs(): any[] {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return this.jobsList;
    }
    const q = this.searchTerm.toLowerCase();
    return this.jobsList.filter(job =>
      (job.title || '').toLowerCase().includes(q) ||
      (job.company_name || '').toLowerCase().includes(q) ||
      (job.location || '').toLowerCase().includes(q) ||
      (job.contract_type || '').toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.adminService.getAllJobs().subscribe({
      next: (data) => {
        this.jobsList = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => this.isLoading = false
    });
  }

  onDeleteJob(jobId: number): void {
    if (confirm("⚠️ Êtes-vous sûr de vouloir supprimer définitivement cette offre d'emploi ?")) {
      this.adminService.deleteJob(jobId).subscribe({
        next: () => {
          this.jobsList = this.jobsList.filter(job => job.id !== jobId);
          this.cdr.detectChanges();
        },
        error: (err) => alert("Erreur lors de la suppression : " + (err.error?.message || err.message))
      });
    }
  }

  openJobCard(job: any): void {
    this.selectedJob = { ...job };
    // Clone job data for editing and format expires_at for date input
    this.jobEditData = { 
      ...job,
      expires_at: job.expires_at ? new Date(job.expires_at).toISOString().split('T')[0] : null
    };

    this.isJobEditMode = false;
    this.showJobCard = true;
  }

  closeJobCard(): void {
    this.showJobCard = false;
    this.selectedJob = null;
  }

  toggleJobEditMode(mode: boolean): void {
    this.isJobEditMode = mode;
    if (!mode) {
      this.jobEditData = { ...this.selectedJob }; // Réinitialise les données d'édition si on annule
    }
  }

  onSaveJobEdit(): void {
    this.adminService.updateJob(this.jobEditData.id, this.jobEditData).subscribe({
      next: (res: any) => {
        const updatedJob = res.job || res;
        const index = this.jobsList.findIndex(j => j.id === updatedJob.id);
        if (index !== -1) {
          this.jobsList[index] = { ...updatedJob };
        }
        this.selectedJob = { ...updatedJob };
        this.isJobEditMode = false;
        this.cdr.detectChanges();
        alert("Offre d'emploi mise à jour !");
      },
      error: (err: any) => alert("Erreur : " + (err.error?.message || "Impossible de mettre à jour l'offre."))
    });
  }

  // Fonctions utilitaires pour les tags (skills, languages)
  getSkillsArray(skills: string): string[] {
    return skills ? skills.split(',').map(s => s.trim()).filter(s => s !== '') : [];
  }

  getLanguagesArray(languages: string): string[] {
    return languages ? languages.split(',').map(l => l.trim()).filter(l => l !== '') : [];
  }
}