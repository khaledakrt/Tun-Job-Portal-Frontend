import { Injectable } from '@angular/core';
import { from, Observable, BehaviorSubject } from 'rxjs'; 
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  // 📡 1. Canal pour l'ouverture classique (avec changement de page vers le Kanban)
  private openApplicationSubject = new BehaviorSubject<number | null>(null);
  public openApplication$ = this.openApplicationSubject.asObservable();

  // 📡 2. 🚀 Canal pour l'ouverture DIRECTE sur place (sans changer de page)
  private activeModalCandidateSubject = new BehaviorSubject<any | null>(null);
  public activeModalCandidate$ = this.activeModalCandidateSubject.asObservable();

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Déclenche l'enregistrement de l'ID (Vérification Kanban)
  triggerCandidateModal(data: any) {
    this.openApplicationSubject.next(data);
  }

  // 🚀 Charge le profil complet de can3 et demande l'affichage immédiat sur place
  triggerDirectModal(applicationId: number) {
    const token = localStorage.getItem('token');
    
    // On interroge l'API de profil recruteur existante pour avoir le détail complet de la candidature
    fetch(`${environment.apiUrl}/recruiter/candidate-profile/${applicationId}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) {
        this.activeModalCandidateSubject.next(data);
      }
    })
    .catch(err => console.error("❌ Erreur chargement direct de la candidature :", err));
  }

  // Ferme la modal en surimpression globale et vide le cache
  closeDirectModal() {
    this.activeModalCandidateSubject.next(null);
  }

  // Vide la mémoire de l'ID classique
    // Vide la mémoire de l'ID ou de l'objet classique pour le prochain clic
  clearTrigger() {
    this.openApplicationSubject.next(null);
  }


  getNotifications(): Observable<any[]> {
    const promise = fetch(this.apiUrl, {
      method: 'GET',
      headers: this.getHeaders() // 🚀 CORRECTION DE SYNTAXE ICI
    }).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
    return from(promise);
  }

  markAllAsRead(): Observable<any> {
    const promise = fetch(`${this.apiUrl}/read`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({})
    }).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
    return from(promise);
  }
}
