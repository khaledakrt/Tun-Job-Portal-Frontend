import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router'; // 🚀 1. AJOUT DE RouterLink ICI
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink], // 🚀 2. AJOUT DE RouterLink DANS LES IMPORTS
  templateUrl: './register.component.html',
  styles: [`
    .register-container { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 80px); width: 100%; background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0 auto; position: relative; }
    .register-card { background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05), 0 20px 48px rgba(0, 0, 0, 0.05); width: 100%; max-width: 440px; box-sizing: border-box; }
    .register-header { text-align: center; margin-bottom: 28px; }
    .brand-title { font-size: 28px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0; letter-spacing: -0.5px; }
    .brand-title span { color: #0284c7; }
    .brand-subtitle { font-size: 14px; color: #64748b; margin: 0; line-height: 1.5; }
    .register-form { display: flex; flex-direction: column; gap: 18px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #334155; }
    .form-group input, .form-select { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; color: #1e293b; background-color: #ffffff; box-sizing: border-box; }
    .btn-submit { width: 100%; padding: 14px; background-color: #0284c7; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    .btn-submit:hover { background-color: #0369a1; }
    .register-footer { text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 18px; }
    .register-footer p { font-size: 14px; color: #64748b; margin: 0; }
    .register-footer a { color: #0284c7; text-decoration: none; font-weight: 600; cursor: pointer; }

    /* Bandeaux d'alertes */
    .alert-box { padding: 14px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; font-weight: 500; text-align: center; animation: slideDown 0.3s ease-out; }
    .alert-success { background-color: #e6f4ea; color: #137333; border: 1px solid #ceead6; }
    .alert-error { background-color: #fce8e6; color: #c5221f; border: 1px solid #fad2cf; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class RegisterComponent {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  user = { name: '', email: '', role: 'candidate', password: '' };
  
  showSuccessMessage = false;
  errorMessage = '';
  countdown = 3;

  onSubmit(event: Event) {
    event.preventDefault();

    this.errorMessage = '';
    this.showSuccessMessage = false;

    const name = this.user.name?.trim();
    const email = this.user.email?.trim();
    const password = this.user.password;

    if (!name || !email || !password) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      this.cdr.detectChanges();
      return;
    }

    if (name.length < 2) {
      this.errorMessage = 'Le nom doit contenir au moins 2 caractères.';
      this.cdr.detectChanges();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage = 'Adresse e-mail invalide.';
      this.cdr.detectChanges();
      return;
    }

    if (password.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
      this.cdr.detectChanges();
      return;
    }

    this.authService
      .register({
        name,
        email,
        password,
        role: this.user.role as 'candidate' | 'recruiter',
      })
      .subscribe({
      next: () => {
        this.showSuccessMessage = true;
        this.cdr.detectChanges();
        const interval = setInterval(() => {
          this.countdown--;
          this.cdr.detectChanges();
          if (this.countdown === 0) {
            clearInterval(interval);
            this.router.navigate(['/login']);
          }
        }, 1000);
      },
      error: (err: any) => {
        this.errorMessage = AuthService.formatHttpError(
          err,
          "Impossible de s'inscrire."
        );
        this.cdr.detectChanges();
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']); // 🟢 CORRECTION : Redirection manuelle vers /login au clic sur le lien
  }
}
