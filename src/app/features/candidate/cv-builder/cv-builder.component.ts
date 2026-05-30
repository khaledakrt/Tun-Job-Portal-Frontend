import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-cv-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cv-builder.component.html',
  styleUrls: ['./cv-builder.component.css']
})
export class CvBuilderComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  cvData = {
    title: '',
    summary: '',
    skills: '',
    interests: '',
    experiences: [] as any[],
    educations: [] as any[]
  };

  candidateName: string = '';
  avatarUrl: string | null = null;
  candidateContact = { email: '', phone: '', address: '' };
  successMessage: string = '';
  isSaving: boolean = false;
showSaveConfirmationModal: boolean = false;
 // 🛠️ Ajoutez ces deux lignes manquantes ici :
  showDeleteConfirmationModal: boolean = false;
  pendingDeleteAction: { type: 'experience' | 'education', index: number } | null = null;
  // 🔒 État du formulaire principal (false = verrouillé/incliquable, true = éditable)
  isEditable: boolean = true;

  // 🎛️ États de contrôle pour les popups (Modales)
  showExperienceModal: boolean = false;
  showEducationModal: boolean = false;

  // ✏️ Indicateurs et index pour le mode édition
  isEditingExp: boolean = false;
  editingExpIndex: number | null = null;
  isEditingEdu: boolean = false;
  editingEduIndex: number | null = null;

  // Modèles tampons pour la saisie dans les popups
  newExperience = { job_title: '', company: '', duration: '', description: '' };
  newEducation = { degree: '', school: '', year: '' };

  ngOnInit() {
    this.candidateName = localStorage.getItem('name') || '';
    this.fetchProfileDetails();
    this.fetchCurrentCV();
  }

  fetchProfileDetails() {
    const token = localStorage.getItem('token');
    fetch(`${environment.apiUrl}/candidate/profile/details`, {
      method: 'GET',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) {
        if (!this.candidateName) {
          this.candidateName = (data.firstname && data.lastname) ? `${data.firstname} ${data.lastname}` : 'Candidat';
        }
            this.candidateContact.email = data.email || '';
        this.candidateContact.phone = data.phone || '';
        this.candidateContact.address = data.address || '';
        if (data.avatar_logo) {
          this.avatarUrl = `${environment.assetsUrl}/logos/${data.avatar_logo}`;
        }
        this.cdr.detectChanges();
      }
    }).catch(() => {});
  }

  fetchCurrentCV() {
    const token = localStorage.getItem('token');
    fetch(`${environment.apiUrl}/candidate/cv/details`, {
      method: 'GET',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) {
        this.cvData.title = data.title || '';
        this.cvData.summary = data.summary || '';
        this.cvData.skills = data.skills || '';
        this.cvData.interests = data.interests || '';
        this.cvData.experiences = typeof data.experience === 'string' ? JSON.parse(data.experience) : (data.experience || []);
        this.cvData.educations = typeof data.education === 'string' ? JSON.parse(data.education) : (data.education || []);
        
        // 🔒 Optionnel : Si le CV contient déjà des données, on peut le verrouiller au chargement initial
        if (this.cvData.title || this.cvData.summary) {
          this.isEditable = false;
        }
        this.cdr.detectChanges();
      }
    }).catch(() => {});
  }

  // 🔓 Active le mode modification
  enableEdit() {
    this.isEditable = true;
    this.cdr.detectChanges();
  }

  // ➕ POPUP EXPÉRIENCE : Mode Ajouter
  openExperienceModal() {
    this.isEditingExp = false;
    this.editingExpIndex = null;
    this.newExperience = { job_title: '', company: '', duration: '', description: '' }; // Reset
    this.showExperienceModal = true;
    this.cdr.detectChanges();
  }

  // ✏️ POPUP EXPÉRIENCE : Mode Modifier (Nouvelle méthode)
  openEditExperienceModal(exp: any, index: number) {
    this.isEditingExp = true;
    this.editingExpIndex = index;
    // On clone l'objet pour éviter la modification en temps réel dans le tableau avant validation
    this.newExperience = { ...exp }; 
    this.showExperienceModal = true;
    this.cdr.detectChanges();
  }

  // 💾 POPUP EXPÉRIENCE : Enregistrement (Ajout ou Mise à jour)
  saveExperienceModal() {
    if (!this.newExperience.job_title || !this.newExperience.company) {
      alert("Veuillez renseigner le poste et l'entreprise.");
      return;
    }

    if (this.isEditingExp && this.editingExpIndex !== null) {
      // Mode modification : on remplace l'élément existant à son index
      this.cvData.experiences[this.editingExpIndex] = { ...this.newExperience };
    } else {
      // Mode ajout : on ajoute l'élément en tête
      this.cvData.experiences.unshift({ ...this.newExperience });
    }

    this.showExperienceModal = false;
    this.cdr.detectChanges();
  }

  removeExperience(index: number) {
    this.pendingDeleteAction = { type: 'experience', index: index };
    this.showDeleteConfirmationModal = true;
    this.cdr.detectChanges();
  }


  // ➕ POPUP ÉTUDES : Mode Ajouter
  openEducationModal() {
    this.isEditingEdu = false;
    this.editingEduIndex = null;
    this.newEducation = { degree: '', school: '', year: '' }; // Reset
    this.showEducationModal = true;
    this.cdr.detectChanges();
  }

  // ✏️ POPUP ÉTUDES : Mode Modifier (Nouvelle méthode)
  openEditEducationModal(edu: any, index: number) {
    this.isEditingEdu = true;
    this.editingEduIndex = index;
    // On clone l'objet d'études
    this.newEducation = { ...edu }; 
    this.showEducationModal = true;
    this.cdr.detectChanges();
  }

  // 💾 POPUP ÉTUDES : Enregistrement (Ajout ou Mise à jour)
  saveEducationModal() {
    if (!this.newEducation.degree || !this.newEducation.school) {
      alert("Veuillez renseigner le diplôme et l'établissement.");
      return;
    }

    if (this.isEditingEdu && this.editingEduIndex !== null) {
      // Mode modification
      this.cvData.educations[this.editingEduIndex] = { ...this.newEducation };
    } else {
      // Mode ajout
      this.cvData.educations.unshift({ ...this.newEducation });
    }

    this.showEducationModal = false;
    this.cdr.detectChanges();
  }

  // 2. Déclenché lors du clic sur le bouton Supprimer de la formation
  removeEducation(index: number) {
    this.pendingDeleteAction = { type: 'education', index: index };
    this.showDeleteConfirmationModal = true;
    this.cdr.detectChanges();
  }
 // 3. Exécuté uniquement si l'utilisateur clique sur "Confirmer" dans la popup de suppression
  confirmDelete() {
    if (this.pendingDeleteAction) {
      const { type, index } = this.pendingDeleteAction;
      
      if (type === 'experience') {
        this.cvData.experiences.splice(index, 1);
      } else if (type === 'education') {
        this.cvData.educations.splice(index, 1);
      }
    }
    
    // Réinitialisation et fermeture
    this.showDeleteConfirmationModal = false;
    this.pendingDeleteAction = null;
    this.cdr.detectChanges();
  }
  getSkillsArray(): string[] { return this.cvData.skills ? this.cvData.skills.split(',').filter(s => s.trim() !== '') : []; }
  getInterestsArray(): string[] { return this.cvData.interests ? this.cvData.interests.split(',').filter(i => i.trim() !== '') : []; }

// 1. Déclenché par le clic sur le bouton de soumission
onSaveCV(event: Event) {
  event.preventDefault();
  // Ouvre la popup de confirmation personnalisée
  this.showSaveConfirmationModal = true;
  this.cdr.detectChanges();
}

// 2. Déclenché uniquement si l'utilisateur clique sur "Confirmer" dans la popup
confirmAndSaveCV() {
  this.showSaveConfirmationModal = false; // Ferme la popup
  this.isSaving = true;
  const token = localStorage.getItem('token');
  
  const nameParts = this.candidateName.trim().split(' ');
  const firstname = nameParts[0] || '';
  const lastname = nameParts.slice(1).join(' ') || '';

  const payload = {
    title: this.cvData.title,
    summary: this.cvData.summary,
    skills: this.cvData.skills,
    interests: this.cvData.interests,
    experience: JSON.stringify(this.cvData.experiences),
    education: JSON.stringify(this.cvData.educations),
    firstname: firstname,
    lastname: lastname,
    email: this.candidateContact.email,
    phone: this.candidateContact.phone,
    address: this.candidateContact.address
  };

  fetch(`${environment.apiUrl}/candidate/cv/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
    body: JSON.stringify(payload)
  })
  .then(res => res.ok ? res.json() : null)
  .then(() => {
    this.successMessage = "Toutes les modifications de votre profil ont été enregistrées !";
    this.isSaving = false;
    this.isEditable = false; 
    this.cdr.detectChanges();
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  })
  .catch(() => { this.isSaving = false; this.cdr.detectChanges(); });
}

}
