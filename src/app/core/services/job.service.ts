import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  // 🚀 RESTRUCTURATION COMPLÈTE ET FIXE : 127.0.0.1 (avec un 1) ET le port :3000 de l'API !
  private apiUrl = 'http://127.0.0.1:3000'; 

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  searchJobs(): Observable<any[]> {
    const promise = fetch(`${this.apiUrl}/auth/jobs/search_public_placeholder_fallback`, {
      method: 'GET',
      headers: this.getHeaders()
    }).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
    return from(promise);
  }

  create(jobData: any): Observable<any> {
    const promise = fetch(`${this.apiUrl}/recruiter/jobs/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(jobData)
    }).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
    return from(promise);
  }

  getRecruiterJobs(): Observable<any[]> {
    const promise = fetch(`${this.apiUrl}/recruiter/jobs/list`, {
      method: 'GET',
      headers: this.getHeaders()
    }).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
    return from(promise);
  }

  toggleStatus(id: string, status: string): Observable<any> {
    const promise = fetch(`${this.apiUrl}/recruiter/jobs/toggle-status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id, status })
    }).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
    return from(promise);
  }
    getStats(): Observable<any> {
    const promise = fetch(`${this.apiUrl}/recruiter/stats`, {
      method: 'GET',
      headers: this.getHeaders()
    }).then(res => {
      if (!res.ok) throw new Error("Erreur lors de la récupération des stats");
      return res.json();
    });
    return from(promise);
  }

}
