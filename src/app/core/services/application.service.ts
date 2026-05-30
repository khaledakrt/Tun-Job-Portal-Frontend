import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QuizAnswerPayload {
  question_id: number;
  choice_id: number;
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/candidate`;

  applyToJob(jobId: number, quizAnswers: QuizAnswerPayload[] = []): Observable<any> {
    return this.http.post(`${this.api}/apply`, {
      job_id: jobId,
      quiz_answers: quizAnswers,
    });
  }

  getHistory(): Observable<any> {
    return this.http.get(`${this.api}/history`);
  }
}
