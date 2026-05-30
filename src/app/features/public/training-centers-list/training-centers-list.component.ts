import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RouterLink, RouterLinkActive } from '@angular/router'; // Ajout de RouterLink et RouterLinkActive
@Component({
  selector: 'app-training-centers-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive], // Ajout de RouterLink et RouterLinkActive
  templateUrl: './training-centers-list.component.html',
  styleUrls: ['./training-centers-list.component.css']
})
export class TrainingCentersListComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  centers: any[] = [];
  isLoading = true;
  isLoggedIn = false;
  assetsUrl = environment.assetsUrl;

  ngOnInit() {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.fetchCenters();
  }

  fetchCenters() {
    this.http.get<any>(`${environment.apiUrl}/public/training-centers`).subscribe({
      next: (data) => {
        this.centers = data.centers || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}