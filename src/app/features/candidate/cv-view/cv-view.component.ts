import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router'; // 🚀 AJOUT : Pour lire l'ID dans l'URL
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-cv-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-view.component.html',
  styleUrls: ['./cv-view.component.css']
})
export class CvViewComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute); // 🚀 AJOUT : Injection du service de routage

  cvData = { title: '', summary: '', skills: '', interests: '', experiences: [] as any[], educations: [] as any[] };
  candidateName: string = '';
  avatarUrl: string | null = null;
  candidateContact = { email: '', phone: '', address: '' };
  isLoading: boolean = true;
  candidateId: string | null = null; // 🚀 AJOUT : Stocke l'ID s'il est fourni dans l'URL

  ngOnInit() {
    // 🚀 Extraction de l'ID depuis l'URL (/candidate/cv-view/7)
    this.candidateId = this.route.snapshot.paramMap.get('id');

    if (!this.candidateId) {
      // Mode classique : Le candidat connecté regarde son propre profil
      this.candidateName = localStorage.getItem('name') || 'Candidat';
    }
    
    this.fetchProfileDetailsAndCV();
  }

  fetchProfileDetailsAndCV() {
    const token = localStorage.getItem('token');
    
    // 🚀 DÉFINITION DYNAMIQUE DES ENDPOINTS
    // Si candidateId existe, on interroge les nouvelles routes d'accès recruteur/public en passant l'ID
    let profileUrl = `${environment.apiUrl}/candidate/profile/details`;
    let cvUrl = `${environment.apiUrl}/candidate/cv/details`;

    if (this.candidateId) {
      profileUrl = `${environment.apiUrl}/recruiter/candidate-profile/${this.candidateId}`;
      cvUrl = `${environment.apiUrl}/recruiter/candidate-cv/${this.candidateId}`;
    }
    
    const profilePromise = fetch(profileUrl, {
      method: 'GET', headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    }).then(res => res.ok ? res.json() : null);

    const cvPromise = fetch(cvUrl, {
      method: 'GET', headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    }).then(res => res.ok ? res.json() : null);

    Promise.all([profilePromise, cvPromise])
      .then(([profileData, cvDetails]) => {
        
        // 1. Extraction des coordonnées (Table users)
        if (profileData) {
          const user = Array.isArray(profileData) ? profileData[0] : profileData;
          if (user) {
            this.candidateContact.email = user.email || '';
            this.candidateContact.phone = user.phone || '';
            this.candidateContact.address = user.address || '';
            this.candidateName = user.name || this.candidateName;
            if (user.avatar_logo) {
              this.avatarUrl = `${environment.assetsUrl}/logos/${user.avatar_logo}`;
            }
          }
        }
        
        // 2. Extraction du parcours (Table cvs)
        if (cvDetails) {
          let cv = Array.isArray(cvDetails) ? cvDetails[0] : cvDetails;

          this.cvData.title = cv.title || 'Poste non configuré';
          this.cvData.summary = cv.summary || 'Aucun résumé disponible.';
          this.cvData.skills = cv.skills || '';
          this.cvData.interests = cv.interests || '';
          
          try {
            this.cvData.experiences = typeof cv.experience === 'string' ? JSON.parse(cv.experience) : (cv.experience || []);
          } catch { this.cvData.experiences = []; }

          try {
            this.cvData.educations = typeof cv.education === 'string' ? JSON.parse(cv.education) : (cv.education || []);
          } catch { this.cvData.educations = []; }
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error("Erreur de synchronisation globale CV :", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  getSkillsArray(): string[] { return this.cvData.skills ? this.cvData.skills.split(',').filter(s => s.trim() !== '') : []; }
  getInterestsArray(): string[] { return this.cvData.interests ? this.cvData.interests.split(',').filter(i => i.trim() !== '') : []; }
}
