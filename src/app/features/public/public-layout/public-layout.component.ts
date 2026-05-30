import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="public-header">
      <nav class="nav">
        <a routerLink="/" class="logo">Tun Job Portal</a>
        <ul class="menu">
          <li><a routerLink="/job-search" routerLinkActive="active">Emplois</a></li>
          <li><a routerLink="/companies" routerLinkActive="active">Entreprises</a></li>
          <li><a routerLink="/training-centers" routerLinkActive="active">Formations</a></li>
          <li><a routerLink="/register">S'inscrire</a></li>
          <li><a routerLink="/login">Se connecter</a></li>
          <li><a routerLink="/about">À propos</a></li>
          <li><a routerLink="/contact">Contact</a></li>
          <li><a routerLink="/terms">Termes</a></li>
        </ul>
      </nav>
    </header>

    <!-- 🕋 Structure 3 colonnes centralisée (wider spacers) -->
    <div [class.public-page-layout]="!isLoggedIn">
      
      @if (!isLoggedIn) {
        <aside class="side-spacer left-spacer"></aside>
      }

      <main class="public-main" [class.public-main-content]="!isLoggedIn">
        <router-outlet></router-outlet>
      </main>

      @if (!isLoggedIn) {
        <aside class="side-spacer right-spacer"></aside>
      }
    </div>
  `,
  styles: [
    `
      .public-header { background:#0ea5e9; padding:12px 20px; color:white; }
      .nav { display:flex; align-items:center; justify-content:space-between; }
      .logo { font-weight:800; color:white; text-decoration:none; }
      .menu { list-style:none; display:flex; gap:18px; margin:0; padding:0; }
      .menu a { color:white; text-decoration:none; font-weight:600; }
      .public-main { padding:20px; }
    `,
  ],
})
export class PublicLayoutComponent implements OnInit {
  isLoggedIn = false;

  ngOnInit() {
    // Vérifie si l'utilisateur est connecté pour masquer les sidebars d'espacement
    this.isLoggedIn = !!localStorage.getItem('token');
  }
}
