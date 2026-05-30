import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './applications-list.component.html',
  styleUrls: ['./applications-list.component.css']
})
export class ApplicationsListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  historyList: any[] = [];
  isLoading: boolean = true;
  selectedRecruiter: any = null; // 🚀 Gère le recruteur sélectionné pour la pop-up
  selectedJob: any = null;       // 🚀 Gère l'offre sélectionnée pour la pop-up de détails
  assetsUrl = environment.assetsUrl;

  ngOnInit() {
    this.fetchCandidateHistory();
  }

  fetchCandidateHistory() {
    const targetUrl = `${environment.apiUrl}/candidate/history`;
    const token = localStorage.getItem('token');

    fetch(targetUrl, {
      method: 'GET',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    })
    .then(async res => {
      if (!res.ok) throw new Error("Impossible de lire votre historique de postulation.");
      return res.json();
    })
    .then(data => {
      this.historyList = data.history || [];
      this.isLoading = false;
      this.cdr.detectChanges();
    })
    .catch(err => {
      console.error("❌ Erreur historique candidat :", err);
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  // 🚀 REQUÊTE DYNAMIQUE POUR APPELER LE PROFIL DE L'ENTREPRISE AU CLIC
  onViewRecruiterProfile(recruiterId: number) {
    if (!recruiterId) return;
    const token = localStorage.getItem('token');
    const targetUrl = `${environment.apiUrl}/candidate/profile/details-public/${recruiterId}`;
    
    fetch(targetUrl, {
      method: 'GET',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      this.selectedRecruiter = data;
      this.cdr.detectChanges();
    })
    .catch(() => {
      alert("Impossible de charger le profil de l'entreprise.");
    });
  }

  onCloseRecruiterModal() {
    this.selectedRecruiter = null;
    this.cdr.detectChanges();
  }

  // 🚀 INTERCEPTE LE CLIC SUR LE TITRE DU POSTE POUR CONSTUIRE L'OBJET DE LA MODALE
  onViewJobDetails(app: any) {
    if (!app) return;
    this.selectedJob = {
      title: app.job_title || app.title,
      company_name: app.company_name || 'REC',
      contract_type: app.contract_type || 'CDI',
      location: app.location || 'Tunisie',
      missions_desc: app.missions_desc || 'Aucune description des missions disponible.',
      profile_desc: app.profile_desc || 'Aucun prérequis spécifié.',
      skills_desc: app.skills_desc || null,
      languages_desc: app.languages_desc || null,
      expires_at: app.expires_at || null,
      company_logo: app.company_logo || null,
      recruiter_id: app.recruiter_id
    };
    this.cdr.detectChanges();
  }

  onCloseJobModal() {
    this.selectedJob = null;
    this.cdr.detectChanges();
  }

  // 🌟 Découpe les compétences textuelles de la base MySQL pour la boucle Angular
  getSearchJobSkillsArray(skillsText: string): string[] {
    if (!skillsText) return [];
    return skillsText.split(',').map(s => s.trim()).filter(s => s !== '');
  }

  // 🌟 Découpe les langues textuelles de la base MySQL pour la boucle Angular
  getSearchJobLanguagesArray(langText: string): string[] {
    if (!langText) return [];
    return langText.split(',').map(s => s.trim()).filter(s => s !== '');
  }
}
