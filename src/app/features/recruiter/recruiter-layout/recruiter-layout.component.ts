import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common'; 
import { NotificationCenterComponent } from '../../../shared/components/notification-center/notification-center.component';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-recruiter-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, NgIf, NotificationCenterComponent], 
  templateUrl: './recruiter-layout.component.html',
  styleUrls: ['./recruiter-layout.component.css'] 
})
export class RecruiterLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone); 
  
  recruiterName = 'Recruteur';
  recruiterAvatar: string | null = null;
  assetsUrl = environment.assetsUrl;
  selectedDirectCandidate: any = null;
  
  // 🏢 L'état du badge passe par cette variable mise à jour par l'API
  isVerifiedCompany = false;
  
  private notifSubscription: Subscription | null = null;

  ngOnInit() {
    const storedName = localStorage.getItem('name');
    if (storedName) {
      this.recruiterName = storedName;
    }

    // 🚀 FIX CHIRURGICAL : Plus de localStorage. On interroge directement MySQL au chargement
    this.checkRealtimeVerification();

    // 🚀 LIAISON SÉCURISÉE AVEC RÉINITIALISATION DYNAMIQUE DU CANDIDAT
    this.notifSubscription = this.notificationService.openApplication$.subscribe(candidateObject => {
      // Si on est sur la page ATS elle-même, on laisse la page ATS gérer l'ouverture (évite les doublons)
      const currentUrl = this.router.url || '';
      if (currentUrl.includes('/recruiter/ats-pipeline')) return;

      if (!candidateObject) {
        this.zone.run(() => {
          this.selectedDirectCandidate = null;
          this.cdr.detectChanges();
        });
        return;
      }

      console.log("📥 Layout global - Reçu l'objet pour affichage de la popup :", candidateObject);
      
      this.zone.run(() => {
        // A. On vide d'abord l'ancien profil pour forcer le rafraîchissement d'Angular
        this.selectedDirectCandidate = null;
        this.cdr.detectChanges();

        // B. On injecte immédiatement le nouveau candidat chargé de MySQL
        this.selectedDirectCandidate = candidateObject; 
        this.cdr.detectChanges(); 
      });
    });
  }

  // 📡 SYNCHRONISATION EN DIRECT PAR API : Cherche la valeur fraîche dans votre table users
  checkRealtimeVerification() {
    const token = localStorage.getItem('token');
    fetch(`${environment.apiUrl}/auth/profile`, {
      method: 'GET',
      headers: { 
        'Authorization': token ? `Bearer ${token}` : '' 
      }
    })
    .then(res => res.json())
    .then(user => {
      // Met à jour la variable avec le vrai état de votre table MySQL (0 ou 1)
      this.isVerifiedCompany = user.is_verified_company === 1;
      
      if (user.company_logo) {
        // On nettoie le chemin si nécessaire pour correspondre à la structure des assets
        this.recruiterAvatar = user.company_logo.replace('/logos/', '').replace('uploads/logos/', '');
      } else {
        this.recruiterAvatar = null;
      }

      this.cdr.detectChanges(); // Force le rafraîchissement visuel du menu
    })
    .catch(err => console.error("❌ Erreur de synchronisation du statut recruteur :", err));
  }

  changeCandidateStatus(applicationId: number, newStatus: string) {
    if (!applicationId) return;
    
    const targetUrl = `${environment.apiUrl}/recruiter/ats/update-status`;
    const token = localStorage.getItem('token');

    fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '' 
      },
      body: JSON.stringify({ id: applicationId, status: newStatus })
    })
    .then(res => {
      if (!res.ok) throw new Error("Échec de la mise à jour du statut.");
      return res.json();
    })
    .then(() => {
      console.log(`✅ Statut mis à jour avec succès : ${newStatus}`);
      this.closeModal(); 
    })
    .catch(err => console.error("❌ Erreur de traitement du changement de statut :", err));
  }

  openCandidateCV(candidateId: number) {
    if (!candidateId) return;
    window.open(`/candidate/cv-view/${candidateId}`, '_blank');
  }

  // 🚀 ACTION DE FERMETURE : Supprime les données en mémoire du service et du composant
  closeModal() {
    this.zone.run(() => {
      this.selectedDirectCandidate = null;
      this.notificationService.clearTrigger(); // Demande au service d'émettre 'null'
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.notifSubscription) {
      this.notifSubscription.unsubscribe();
    }
    this.notificationService.clearTrigger();
  }

  onLogout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
