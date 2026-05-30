import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { tunisianCities } from '../../../shared/data/tunisian-cities';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css'
})
export class ProfileSettingsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  profile = { name: '', company_name: '', phone: '', email: '', address: '', company_bio: '' };
  backupProfile = { name: '', company_name: '', phone: '', email: '', address: '', company_bio: '' };
  logoPreviewUrl: string | null = null;
  selectedFile: File | null = null;
  successMessage = '';
  
  // Autocomplétion Localisation
  filteredLocations: { ville: string; cite: string }[] = [];
  showLocationSuggestions: boolean = false;

  isEditMode = false; // Controle de gauche (Profil)
  isPasswordEditMode = false; // 🚀 NOUVEAU : Controle de droite (Mot de passe)

  passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  assetsUrl = environment.assetsUrl;

  ngOnInit() {
    // 🚀 Pré-remplissage immédiat avec le nom stocké à la connexion pour éviter le "Non renseigné"
    this.profile.name = localStorage.getItem('name') || '';
    this.loadCurrentProfile();
  }

  toggleEditMode(mode: boolean) {
    this.isEditMode = mode;
    if (mode) {
      this.backupProfile = { ...this.profile };
    } else {
      this.profile = { ...this.backupProfile };
    }
    this.cdr.detectChanges();
  }

  // 🚀 NOUVELLE BASCULE POUR LE MOT DE PASSE INDÉPENDANT
  togglePasswordEditMode(mode: boolean) {
    this.isPasswordEditMode = mode;
    if (!mode) {
      // Si on annule, on vide la saisie
      this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
    }
    this.cdr.detectChanges();
  }

    loadCurrentProfile() {
    const targetUrl = `${environment.apiUrl}/recruiter/profile/details`;
    const token = localStorage.getItem('token');

    fetch(targetUrl, {
      method: 'GET',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    })
    .then(async res => {
      if (res.ok) return res.json();
      throw new Error();
    })
    .then(data => {
      if (data) {
        // 🚀 FIX : On récupère le 'name' de la DB. 
        // Si la DB renvoie null, on tente de restaurer depuis le localStorage
        // pour éviter d'écraser une session active avec du vide.
        this.profile.name = data.name || localStorage.getItem('name') || '';
        
        this.profile.company_name = data.company_name || '';
        this.profile.phone = data.phone || '';
        this.profile.email = data.email || '';
        this.profile.address = data.address || '';
        this.profile.company_bio = data.company_bio || '';
        
        // 🚀 VÉRIFICATION ET ALIGNEMENT DU LOGO
        if (data.company_logo) {
          // Sécurité : Si l'ancienne chaîne contient déjà '/logos/', on extrait uniquement le nom du fichier
          const cleanFilename = data.company_logo.replace('/logos/', '');
          
          // 🌟 Recomposition propre vers le dossier exposé par votre serveur Express
          this.logoPreviewUrl = `${this.assetsUrl}/logos/${cleanFilename}`;
        }
        this.cdr.detectChanges();
      }
    })
    .catch((err) => {
      console.warn("⚠️ Impossible de charger le profil complet, utilisation du storage local.");
      // En cas d'erreur, on s'assure que le nom du responsable est au moins celui de la session
      this.profile.name = this.profile.name || localStorage.getItem('name') || '';
      this.cdr.detectChanges();
    });
  }


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreviewUrl = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  onSaveProfile(event: Event) {
    event.preventDefault();

    const targetUrl = `${environment.apiUrl}/recruiter/profile/update`;
    const token = localStorage.getItem('token');

    const formData = new FormData();
    // On s'assure d'envoyer la valeur actuelle, même si elle vient d'être modifiée
    formData.append('name', this.profile.name);
    formData.append('company_name', this.profile.company_name);
    formData.append('phone', this.profile.phone);
    formData.append('email', this.profile.email);
    formData.append('address', this.profile.address);
    formData.append('company_bio', this.profile.company_bio);

    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }

    fetch(targetUrl, {
      method: 'POST',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      body: formData
    })
    .then(async res => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Impossible de sauvegarder votre profil.");
      }
      return res.json();
    })
    .then(resData => {
      // 🚀 FIX : On synchronise le nom du responsable (et non de la société) dans le localStorage
      localStorage.setItem('name', this.profile.name);
      
      this.successMessage = resData.message || "Les informations de votre profil et votre logo ont été mis à jour.";
      this.isEditMode = false;
      
      // 🔄 On met à jour le backup pour refléter les nouvelles données enregistrées
      this.backupProfile = { ...this.profile };
      this.cdr.detectChanges();

      setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
    })
    .catch(err => alert(err.message));
  }

  onUpdatePassword(event: Event) {
    event.preventDefault();
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.passwordErrorMessage = "La confirmation ne correspond pas au nouveau mot de passe.";
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.passwordErrorMessage = "Le nouveau mot de passe doit contenir au moins 6 caractères.";
      return;
    }

    const targetUrl = `${environment.apiUrl}/recruiter/profile/change-password`;
    const token = localStorage.getItem('token');

    fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        currentPassword: this.passwordData.currentPassword,
        newPassword: this.passwordData.newPassword
      })
    })
    .then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Erreur lors du changement de mot de passe.");
      return data;
    })
    .then(data => {
      this.passwordSuccessMessage = data.message || "Votre mot de passe a été modifié avec succès !";
      this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      this.isPasswordEditMode = false; // 🚀 Fermeture automatique après succès
      this.cdr.detectChanges();

      setTimeout(() => { this.passwordSuccessMessage = ''; this.cdr.detectChanges(); }, 4000);
    })
    .catch(err => {
      this.passwordErrorMessage = err.message;
      this.cdr.detectChanges();
    });
  }

  // ============================================================================
  // 🚀 AUTOCOMPLÉTION ADRESSE
  // ============================================================================

  onLocationInput(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    if (searchTerm.length > 0) {
      this.filteredLocations = (tunisianCities as { ville: string; cite: string }[]).filter(
        (loc: { ville: string; cite: string }) => 
          loc.ville.toLowerCase().startsWith(searchTerm) || 
          loc.cite.toLowerCase().startsWith(searchTerm)
      );
      this.showLocationSuggestions = this.filteredLocations.length > 0;
    } else {
      this.filteredLocations = [];
      this.showLocationSuggestions = false;
    }
  }

  selectLocation(location: { ville: string; cite: string }) {
    this.profile.address = `${location.ville}, ${location.cite}`;
    this.showLocationSuggestions = false;
  }

  onLocationBlur() {
    // Délai pour permettre le clic sur une suggestion avant de cacher la liste
    setTimeout(() => { this.showLocationSuggestions = false; }, 150);
  }
}
