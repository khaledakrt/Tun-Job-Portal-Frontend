 
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})

export class ManageUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);
  readonly assetsUrl = environment.assetsUrl;

  usersList: any[] = [];
  isLoading = false;
  searchTerm = '';
  selectedUser: any = null;
  showUserCard = false;
  isUserEditMode = false;
  userEditData: any = {};

  get filteredUsers(): any[] {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return this.usersList;
    }
    const q = this.searchTerm.toLowerCase();
    return this.usersList.filter(user =>
      (user.name || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.role || '').toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.usersList = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => this.isLoading = false
    });
  }

   // ... votre code actuel et votre fonction onDeleteUser ...

  onDeleteUser(userId: number): void {
    if (confirm("⚠️ Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur de Tun-Job ?")) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.usersList = this.usersList.filter(u => u.id !== userId);
          this.cdr.detectChanges();
        }
      });
    }
  }

  openUserCard(user: any): void {
    this.selectedUser = { ...user };
    this.userEditData = { ...user };
    this.isUserEditMode = false;
    this.showUserCard = true;
  }

  closeUserCard(): void {
    this.showUserCard = false;
    this.selectedUser = null;
  }

  toggleUserEditMode(mode: boolean): void {
    this.isUserEditMode = mode;
    if (!mode) {
      this.userEditData = { ...this.selectedUser };
    }
  }

  getUserRoleLabel(user: any): string {
    return user?.role === 'recruiter' ? 'Recruteur' : 'Candidat';
  }

  getVerificationLabel(user: any): string {
    if (user?.role === 'recruiter') {
      return user.is_verified_company ? 'Entreprise certifiée' : 'Certification en attente';
    }
    return user.is_verified ? 'Compte vérifié' : 'Compte non vérifié';
  }

  // 👑 COLLEZ LE CODE JUSTE ICI, AVANT LA DERNIÈRE ACCOLADE DE FERMETURE :
  onToggleVerification(user: any): void {
    const nextStatus = user.is_verified_company ? 0 : 1;
    this.adminService.toggleCompanyVerification(user.id, nextStatus).subscribe({
      next: () => {
        user.is_verified_company = nextStatus; // Met à jour l'interface instantanément
        this.cdr.detectChanges();
      }
    });
  }

  onSaveUserEdit(): void {
    this.adminService.updateUser(this.userEditData.id, this.userEditData).subscribe({
      next: (res: any) => {
        const updatedUser = res.user || res;
        const index = this.usersList.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.usersList[index] = { ...updatedUser };
        }
        this.selectedUser = { ...updatedUser };
        this.isUserEditMode = false;
        this.cdr.detectChanges();
        alert("Profil utilisateur mis à jour !");
      },
      error: (err: any) => alert("Erreur : " + (err.error?.message || "Impossible de mettre à jour."))
    });
  }

} // 👈 Cette accolade ferme toute votre classe, laissez-la bien tout en bas
