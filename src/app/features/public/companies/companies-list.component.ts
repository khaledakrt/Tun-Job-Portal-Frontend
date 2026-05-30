import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './companies-list.component.html',
  styleUrls: ['./companies-list.component.css']
})
export class CompaniesListComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  companies: any[] = [];
  isLoading = true;
  isLoggedIn = false;
  assetsUrl = environment.assetsUrl;

  ngOnInit() {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.fetchCompanies();
  }

  fetchCompanies() {
    this.http.get<any>(`${environment.apiUrl}/public/companies`).subscribe({
      next: (data) => {
        this.companies = data.companies || [];
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