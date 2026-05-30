import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  OnDestroy,
  NgZone
} from '@angular/core';

import {
  CommonModule,
  NgIf,
  NgFor,
  DatePipe
} from '@angular/common';

import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DatePipe],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.css']
})
export class NotificationCenterComponent implements OnInit, OnDestroy {

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);
  private zone = inject(NgZone);

  notificationsList: any[] = [];
  unreadCount: number = 0;
  showNotificationDropdown: boolean = false;

  private eventSource: EventSource | null = null;

  // ============================================================================
  // 🚀 DÉDUPLICATION DES NOTIFICATIONS
  // ============================================================================

  private pushUniqueNotification(newNotif: any) {

    if (!newNotif) return;

    try {

      const nid = newNotif.id;

      if (nid) {
        const exists = this.notificationsList.some(n => n.id === nid);

        if (exists) return;
      }

      const msg = (newNotif.message || '').trim();

      const cand =
        newNotif.candidate_id ||
        newNotif.candidateId ||
        null;

      const job =
        newNotif.job_title ||
        newNotif.job ||
        null;

      const similar = this.notificationsList.some(n => {

        if (!n) return false;

        const nmsg = (n.message || '').trim();

        const ncand =
          n.candidate_id ||
          n.candidateId ||
          null;

        const njob =
          n.job_title ||
          n.job ||
          null;

        if (nmsg && msg && nmsg === msg) {
          return true;
        }

        if (
          ncand &&
          cand &&
          ncand === cand &&
          njob &&
          job &&
          njob === job
        ) {
          return true;
        }

        return false;
      });

      if (similar) return;

      this.notificationsList.unshift(newNotif);

      this.unreadCount = this.notificationsList.filter(
        n => !n.is_read || n.is_read === 0
      ).length;

    } catch (e) {

      this.notificationsList.unshift(newNotif);

      this.unreadCount = this.notificationsList.filter(
        n => !n.is_read || n.is_read === 0
      ).length;
    }
  }

  // ============================================================================
  // 🚀 INIT
  // ============================================================================

  ngOnInit() {
    this.loadNotificationHistory();
    this.startLiveNotifications();
  }

  // ============================================================================
  // 🚀 AVATAR
  // ============================================================================

  avatarUrl(filename: string | null | undefined): string {

    if (!filename) {
      return 'assets/images/default-avatar.png';
    }

    if (
      filename.startsWith('http://') ||
      filename.startsWith('https://') ||
      filename.startsWith('/')
    ) {
      return filename;
    }

    const lower = filename.toLowerCase();

    if (lower.startsWith('avatar-')) {
      return `${environment.assetsUrl}/avatars/${filename}`;
    }

    if (lower.startsWith('logo-')) {
      return `${environment.assetsUrl}/logos/${filename}`;
    }

    return `${environment.assetsUrl}/avatars/${filename}`;
  }

  // ============================================================================
  // 🚀 HISTORIQUE
  // ============================================================================

  loadNotificationHistory() {

    const token = localStorage.getItem('token');

    fetch(`${environment.apiUrl}/notifications/history`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => res.ok ? res.json() : { notifications: [] })

      .then(data => {

        const items = data.notifications || [];

        const map = new Map<any, any>();

        for (const it of items) {

          if (it && it.id) {
            map.set(it.id, it);
          }
        }

        const unique = Array.from(map.values());

        unique.sort((a: any, b: any) => {

          const ta =
            new Date(a.created_at || a.createdAt || 0).getTime() || 0;

          const tb =
            new Date(b.created_at || b.createdAt || 0).getTime() || 0;

          return tb - ta;
        });

        this.notificationsList = unique;

        this.unreadCount = this.notificationsList.filter(
          n => !n.is_read || n.is_read === 0
        ).length;

        this.cdr.detectChanges();
      })

      .catch(err => {
        console.error(
          '❌ Erreur chargement historique notifications :',
          err
        );
      });
  }

  // ============================================================================
  // 🚀 SSE LIVE
  // ============================================================================

  startLiveNotifications() {

    const token = localStorage.getItem('token');

    if (!token) return;

    this.eventSource = new EventSource(
      `${environment.apiUrl}/notifications/stream?token=${token}`
    );

    this.eventSource.onmessage = (event) => {

      try {

        const newNotif = JSON.parse(event.data);

        console.log(
          '🔔 [LIVE NOTIF] Reçu dans le centre de notifications :',
          newNotif
        );

        this.zone.run(() => {

          this.pushUniqueNotification(newNotif);

          this.cdr.detectChanges();
        });

      } catch (err) {

        console.error(
          '❌ Erreur traitement JSON SSE :',
          err
        );
      }
    };

    this.eventSource.onerror = (err) => {

      console.error(
        '⚠️ Connexion SSE interrompue dans le centre de notifications.',
        err
      );
    };
  }

  // ============================================================================
  // 🚀 DROPDOWN
  // ============================================================================

  toggleNotifications() {
    this.showNotificationDropdown =
      !this.showNotificationDropdown;
  }

  // ============================================================================
  // 🚀 READ NOTIFICATION
  // ============================================================================

  readNotification(notif: any) {

    const token = localStorage.getItem('token');

    // ==========================================================================
    // 🚀 MARK AS READ
    // ==========================================================================

    if (!notif.is_read || notif.is_read === 0) {

      fetch(`${environment.apiUrl}/notifications/read`, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },

        body: JSON.stringify({
          id: notif.id
        })

      })

        .then(res => {

          if (res.ok) {

            this.notificationsList =
              this.notificationsList.filter(
                n => n.id !== notif.id
              );

            this.unreadCount =
              this.notificationsList.length;

            this.cdr.detectChanges();
          }
        })

        .catch(err => {

          console.error(
            '❌ Erreur mark-as-read:',
            err
          );
        });
    }

    this.showNotificationDropdown = false;

    // ==========================================================================
    // 🚀 ROUTING MULTI-RÔLES
    // ==========================================================================

    const userRole =
      localStorage.getItem('role')?.toLowerCase() || '';

    const msg =
      (notif.message || '').toLowerCase();

    // ==========================================================================
    // 🚀 RECRUITER
    // ==========================================================================

    if (
      userRole === 'recruiter' &&
      msg.includes('postulé')
    ) {

      fetch(
        `${environment.apiUrl}/notifications/candidate-by-notif/${notif.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      )

        .then(res => {

          if (!res.ok) {
            throw new Error(
              'Erreur de rapatriement relationnel SQL.'
            );
          }

          return res.json();
        })

        .then(dynamicData => {

          if (dynamicData) {

            const candidateObject =
              Array.isArray(dynamicData)
                ? dynamicData
                : dynamicData;

            console.log(
              '🎯 Objet nettoyé et envoyé au Layout global Recruteur :',
              candidateObject
            );

            this.zone.run(() => {
              this.notificationService.triggerCandidateModal(
                candidateObject
              );
            });
          }
        })

        .catch(err => {

          console.error(
            '❌ Impossible de charger les données réelles du candidat :',
            err
          );
        });
    }

    // ==========================================================================
    // 🚀 CANDIDATE
    // ==========================================================================

    else if (

      userRole === 'candidate' ||
      userRole === 'seeker' ||

      msg.includes('statut') ||
      msg.includes('entretien') ||
      msg.includes('accepté')

    ) {

      let currentStatus = "En cours d'étude";

      if (msg.includes('entretien')) {
        currentStatus = 'Entretien';
      }

      if (
        msg.includes('accepté') ||
        msg.includes('proposition')
      ) {
        currentStatus = 'Proposition';
      }

      if (
        msg.includes('refusé') ||
        msg.includes('rejete')
      ) {
        currentStatus = 'Refusé';
      }

      fetch(
        `${environment.apiUrl}/notifications/recruiter-by-notif/${notif.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      )

        .then(res => {

          if (!res.ok) {
            throw new Error(
              "Erreur de rapatriement de l'entreprise SQL."
            );
          }

          return res.json();
        })

        .then(serverData => {

          if (serverData) {

            const recruiterObject =
              Array.isArray(serverData)
                ? serverData
                : serverData;

            const candidatePayload = {

              company_name:
                recruiterObject.company_name,

              job_title:
                recruiterObject.job_title,

              email:
                recruiterObject.email,

              phone:
                recruiterObject.phone,

              address:
                recruiterObject.address,

              avatar_logo:
                recruiterObject.avatar_logo,

              status:
                currentStatus,

              message:
                notif.message,

              created_at:
                recruiterObject.created_at ||
                notif.created_at ||
                new Date()
            };

            console.log(
              '🎯 [CANDIDAT] Envoi des données réelles du recruteur au Layout :',
              candidatePayload
            );

            this.zone.run(() => {

              this.notificationService.triggerCandidateModal(
                candidatePayload
              );
            });
          }
        })

        .catch(err => {

          console.error(
            '❌ Impossible de charger les données réelles de la société :',
            err
          );
        });
    }
  }

  // ============================================================================
  // 🚀 AVATAR DIRECT
  // ============================================================================

  avatarUrlDirect(
    filename: string | null | undefined
  ): string {

    if (!filename) {
      return 'assets/images/default-avatar.png';
    }

    if (
      filename.startsWith('http://') ||
      filename.startsWith('https://') ||
      filename.startsWith('/')
    ) {
      return filename;
    }

    const baseUrl =
      environment.apiUrl || 'http://localhost:3000';

    return `${baseUrl}/uploads/avatars/${filename}`;
  }

  // ============================================================================
  // 🚀 DESTROY
  // ============================================================================

  ngOnDestroy() {

    if (this.eventSource) {
      this.eventSource.close();
    }
  }
    // 🚀 INTERCEPTEUR INTELLIGENT POUR RETROUVER LA PHOTO DU RECRUTEUR
  getAvatarUrl(filename: string | null | undefined, messageContext: string = ''): string {
    if (!filename) {
      return 'assets/images/default-avatar.png';
    }
    
    if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('/')) {
      return filename;
    }
    
    const baseUrl = 'http://localhost:3000';
    const msg = (messageContext || '').toLowerCase();

    // Si le message contient l'emoji ou parle de statut, on force le dossier des logos recruteurs
    if (msg.includes('📧') || msg.includes('statut') || msg.includes('candidature') || msg.includes('entretien')) {
      const cleanLogo = filename.replace('/logos/', '').replace('/uploads/logos/', '');
      return `${baseUrl}/uploads/logos/${cleanLogo}`;
    }
    
    // Sinon, comportement normal pour l'avatar d'un candidat
    const cleanAvatar = filename.replace('/avatars/', '').replace('/uploads/avatars/', '');
    return `${baseUrl}/uploads/avatars/${cleanAvatar}`;
  }

}