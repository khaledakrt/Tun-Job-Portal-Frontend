import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; // Chemin corrigé
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="contact-container">
      <h1>Contact</h1>

      <form #f="ngForm" (ngSubmit)="onSubmit()" *ngIf="!submitted" novalidate class="contact-form">
        <div class="form-row">
          <label>Nom</label>
          <input name="name" [(ngModel)]="payload.name" required />
        </div>

        <div class="form-row">
          <label>Email</label>
          <input name="email" type="email" [(ngModel)]="payload.email" required />
        </div>

        <div class="form-row">
          <label>Sujet</label>
          <input name="subject" [(ngModel)]="payload.subject" />
        </div>

        <div class="form-row">
          <label>Message</label>
          <textarea name="message" rows="6" [(ngModel)]="payload.message" required></textarea>
        </div>

        <div class="actions">
          <button type="submit" [attr.disabled]="isSubmitting ? true : null">Envoyer</button>
        </div>
      </form>

      <div *ngIf="submitted" class="success">
        Merci — votre message a été envoyé. Nous vous répondrons bientôt.
      </div>

      <div *ngIf="error" class="error">{{ error }}</div>
    </section>
  `,
  styles: [
    `
      .contact-container { max-width:720px; margin:0 auto; padding:20px; position: relative; }
      .contact-form { display:flex; flex-direction:column; gap:12px; }
      .form-row { display:flex; flex-direction:column; }
      input, textarea { padding:10px; border:1px solid #cbd5e1; border-radius:6px; }
      .actions { margin-top:8px; position: relative; z-index: 12005; }
      button { background:#0ea5e9; color:white; border:none; padding:10px 16px; border-radius:8px; font-weight:700; cursor: pointer; pointer-events: auto; }
      button[disabled] { opacity:0.6; cursor:not-allowed; }
      .success { padding:12px; background:#e6f4ea; color:#137333; border-radius:8px; }
      .error { padding:12px; background:#fde8e8; color:#9b1c1c; border-radius:8px; }
    `,
  ],
})
export class ContactComponent {
  private http = inject(HttpClient);
  @ViewChild('f') contactForm?: NgForm;
  payload = { name: '', email: '', subject: '', message: '' };
  isSubmitting = false;
  submitted = false;
  error = '';
  successMessage = '';

  onSubmit() {
    // Client-side validation
    if (!this.payload.name || !this.payload.email || !this.payload.message) {
      this.error = "Veuillez remplir le nom, l'email et le message.";
      this.submitted = false;
      return;
    }

    // Strict email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.payload.email)) {
      this.error = "Veuillez fournir une adresse e-mail valide.";
      this.submitted = false;
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    this.http.post(`${environment.apiUrl}/contact`, this.payload).subscribe({
      next: () => {
        this.submitted = true;
        this.successMessage = 'Message envoyé — nous vous répondrons bientôt.';
        this.isSubmitting = false;
        // reset form and payload
        this.contactForm?.resetForm();
        this.payload = { name: '', email: '', subject: '', message: '' };
      },
      error: (err) => {
        this.error = err?.error?.message || "Erreur lors de l'envoi du message.";
        this.isSubmitting = false;
        this.submitted = false;
      },
    });
  }
}
