import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <h1>À propos</h1>
      <p>Bienvenue sur Tun Job Portal — trouvez des offres rapidement.</p>
    </section>
  `,
})
export class AboutComponent {}
