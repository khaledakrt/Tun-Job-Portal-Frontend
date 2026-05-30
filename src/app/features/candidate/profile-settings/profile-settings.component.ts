import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { tunisianCities } from '../../../shared/data/tunisian-cities';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css'
})
export class ProfileSettingsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  // 📝 Modèle de données enrichi pour le profil candidat
  profile = { 
    name: '', phone: '', email: '', address: '', avatar_logo: null,
    birth_date: '', linkedin: '', github: '', job_status: '', availability: '', job_type: '', location_pref: ''
  };
  
  backupProfile = { 
    name: '', phone: '', email: '', address: '', avatar_logo: null,
    birth_date: '', linkedin: '', github: '', job_status: '', availability: '', job_type: '', location_pref: ''
  };
  
  logoPreviewUrl: string | null = null;
  selectedFile: File | null = null;
  successMessage = '';

  // Autocomplétion Localisation
  filteredLocations: { ville: string; cite: string }[] = [];
  showLocationSuggestions: boolean = false;
  
  // 🎛️ États de contrôle des formulaires indépendants
  isEditMode = false;         // Pour "Mon Profil Candidat"
  isProEditMode = false;      // 🆕 Pour "Profil Professionnel"
  isPasswordEditMode = false; // Pour "Sécurité du compte"

  passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  ngOnInit() {
    this.loadCurrentProfile();
  }

  // 🔄 Bascule d'édition pour les informations personnelles
  toggleEditMode(mode: boolean) {
    this.isEditMode = mode;
    if (mode) {
      this.backupProfile = { ...this.profile };
    } else {
      this.profile = { ...this.backupProfile };
    }
    this.cdr.detectChanges();
  }

  // 🔄 Bascule d'édition pour le profil professionnel
  toggleProEditMode(mode: boolean) {
    this.isProEditMode = mode;
    if (mode) {
      this.backupProfile = { ...this.profile };
    } else {
      this.profile = { ...this.backupProfile };
    }
    this.cdr.detectChanges();
  }

  togglePasswordEditMode(mode: boolean) {
    this.isPasswordEditMode = mode;
    if (!mode) {
      this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
    }
    this.cdr.detectChanges();
  }

  loadCurrentProfile() {
    const targetUrl = `${environment.apiUrl}/candidate/profile/details`;
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
        this.profile.name = data.name || localStorage.getItem('name') || '';
        this.profile.email = data.email || '';
        this.profile.phone = data.phone || '';
        this.profile.address = data.address || '';
        
        // Formate correctement la date pour l'input HTML type="date"
        this.profile.birth_date = data.birth_date ? data.birth_date.split('T')[0] : '';
        this.profile.linkedin = data.linkedin || '';
        this.profile.github = data.github || '';
        this.profile.job_status = data.job_status || '';
        this.profile.availability = data.availability || '';
        this.profile.job_type = data.job_type || '';
        this.profile.location_pref = data.location_pref || '';
        
        if (data.avatar_logo) {
          const cleanFilename = data.avatar_logo.replace('/logos/', '').replace('uploads/logos/', '');
          this.logoPreviewUrl = `${environment.assetsUrl}/logos/${cleanFilename}`;
        }
        this.cdr.detectChanges();
      }
    })
    .catch(() => {
      this.profile.name = localStorage.getItem('name') || '';
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

      const targetUrl = `${environment.apiUrl}/candidate/profile/update-avatar`;
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('logo', file, file.name);

      fetch(targetUrl, {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        body: formData
      })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Échec d'envoi de la photo.");
        }
        return res.json();
      })
      .then(data => {
        this.successMessage = "Votre photo de profil a été mise à jour !";
        
        if (data && data.filename) {
          this.logoPreviewUrl = `${environment.assetsUrl}/logos/${data.filename}`;
        }

        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      })
      .catch(err => {
        console.error("❌ Erreur Upload Frontend :", err);
        alert(err.message);
      });
    }
  }

  onSaveProfile(event: Event) {
    if (event) event.preventDefault();

    const targetUrl = `${environment.apiUrl}/candidate/profile/update`;
    const token = localStorage.getItem('token');

    fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '' 
      },
      body: JSON.stringify({
        name: this.profile.name,
        email: this.profile.email,
        phone: this.profile.phone,
        address: this.profile.address,
        birth_date: this.profile.birth_date,
        linkedin: this.profile.linkedin,
        github: this.profile.github,
        job_status: this.profile.job_status,
        availability: this.profile.availability,
        job_type: this.profile.job_type,
        location_pref: this.profile.location_pref
      })
    })
    .then(async res => {
      if (!res.ok) throw new Error("Impossible de sauvegarder votre profil.");
      return res.json();
    })
    .then(resData => {
      this.successMessage = resData.message || "Les informations de votre profil ont été mises à jour.";
      this.isEditMode = false;
      this.isProEditMode = false; // Ferme l'état d'édition
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

    const targetUrl = `${environment.apiUrl}/candidate/profile/change-password`;
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
      this.isPasswordEditMode = false;
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
