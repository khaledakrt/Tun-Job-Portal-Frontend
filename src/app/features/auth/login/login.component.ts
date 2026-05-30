import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styles: [`
    .login-container { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 80px); width: 100%; background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0 auto; position: relative; }
    .login-card { background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05), 0 20px 48px rgba(0, 0, 0, 0.05); width: 100%; max-width: 420px; box-sizing: border-box; }
    .login-header { text-align: center; margin-bottom: 32px; }
    .brand-title { font-size: 28px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0; letter-spacing: -0.5px; }
    .brand-title span { color: #0284c7; }
    .brand-subtitle { font-size: 14px; color: #64748b; margin: 0; line-height: 1.5; }
    .login-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #334155; }
    .form-group input { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; color: #1e293b; background-color: #ffffff; box-sizing: border-box; }
    .form-group input:focus { border-color: #0284c7; box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.15); outline: none; }
    .btn-submit { width: 100%; padding: 14px; background-color: #0284c7; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 10px; }
    .btn-submit:hover { background-color: #0369a1; }
    .login-footer { text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .login-footer p { font-size: 14px; color: #64748b; margin: 0; }
    .login-footer a { color: #0284c7; text-decoration: none; font-weight: 600; cursor: pointer; }
    .login-footer a:hover { text-decoration: underline; }

    /* 🔴 BANDEAU ALERTE ROUGE PROFESSIONNEL */
    .alert-box { padding: 14px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; font-weight: 500; text-align: center; animation: slideDown 0.3s ease-out; }
    .alert-error { background-color: #fce8e6; color: #c5221f; border: 1px solid #fad2cf; }
    
    /* 🟢 NOUVEAU : BANDEAU ALERTE VERT PROFESSIONNEL D'ACTIVATION */
    .alert-success { background-color: #e6f4ea; color: #137333; border: 1px solid #ceead6; }
    
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  credentials = { email: '', password: '' };
  errorMessage = '';
  isEmailVerified = false; 

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['verified'] === 'true') {
        this.isEmailVerified = true;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault(); 
    this.errorMessage = '';
    this.isEmailVerified = false; 

    const email = this.credentials.email?.trim();
    const password = this.credentials.password;

    if (!email || !password) {
      this.errorMessage = 'Veuillez saisir vos identifiants.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage = 'Adresse e-mail invalide.';
      return;
    }

    this.authService.login({ email, password }).subscribe({
      next: (res: any) => {
        if (res.is_verified_company !== undefined) {
          localStorage.setItem('is_verified_company', res.is_verified_company.toString());
        } else {
          localStorage.setItem('is_verified_company', '0');
        }
        this.router.navigate([`/${res.role}`]);
      },
      error: (err: any) => {
        this.errorMessage = AuthService.formatHttpError(
          err,
          'Identifiants ou mot de passe incorrects.'
        );
        this.cdr.detectChanges();
      },
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
