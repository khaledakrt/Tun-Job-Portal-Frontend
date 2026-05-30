import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-manage-applications',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule, DatePipe],
  templateUrl: './manage-applications.component.html',
  styleUrls: ['./manage-applications.component.css']
})
export class ManageApplicationsComponent implements OnInit {
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);
  readonly assetsUrl = environment.assetsUrl;

  applicationsList: any[] = [];
  isLoading = false;
  searchTerm = '';
  selectedApp: any = null;
  showAppCard = false;
  isEditMode = false;
  editData: any = {};

  readonly statusList = ['Nouveau', 'En cours', 'Entretien', 'Accepté', 'Refusé'];

  get filteredApplications(): any[] {
    if (!this.searchTerm || !this.searchTerm.trim()) return this.applicationsList;
    const q = this.searchTerm.toLowerCase();
    return this.applicationsList.filter(app =>
      (app.candidate_name || '').toLowerCase().includes(q) ||
      (app.job_title || '').toLowerCase().includes(q) ||
      (app.status || '').toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.adminService.getAllApplications().subscribe({
      next: (data) => {
        this.applicationsList = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => this.isLoading = false
    });
  }

  onDeleteApplication(id: number): void {
    if (confirm("⚠️ Souhaitez-vous supprimer définitivement cette candidature ?")) {
      this.adminService.deleteApplication(id).subscribe({
        next: () => {
          this.applicationsList = this.applicationsList.filter(a => a.id !== id);
          this.cdr.detectChanges();
        }
      });
    }
  }

  openAppCard(app: any): void {
    this.selectedApp = { ...app };
    this.editData = { ...app };
    this.isEditMode = false;
    this.showAppCard = true;
  }

  onSaveEdit(): void {
    this.adminService.updateApplication(this.editData.id, this.editData).subscribe({
      next: (updated: any) => {
        const idx = this.applicationsList.findIndex(a => a.id === updated.id);
        if (idx !== -1) this.applicationsList[idx] = { ...this.applicationsList[idx], ...updated };
        this.selectedApp = { ...this.selectedApp, ...updated };
        this.isEditMode = false;
        this.cdr.detectChanges();
        alert("Candidature mise à jour !");
      }
    });
  }
}