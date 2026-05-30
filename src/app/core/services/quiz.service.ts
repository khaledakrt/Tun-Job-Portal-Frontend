import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface JobQuizPayload {
  title: string;
  questions: { question_text: string; question_type: string; choices: { choice_text: string; is_correct: boolean }[] }[];
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getQuizForJob(jobId: number, publicAccess = false): Observable<any> {
    const url = publicAccess
      ? `${environment.assetsUrl}/api/public/jobs/${jobId}/quiz`
      : `${this.api}/candidate/jobs/${jobId}/quiz`;
    return this.http.get(url);
  }

  getRecruiterQuiz(jobId: number): Observable<any> {
    return this.http.get(`${this.api}/recruiter/jobs/${jobId}/quiz`);
  }

  saveQuizForJob(jobId: number, payload: JobQuizPayload): Observable<any> {
    return this.http.post(`${this.api}/recruiter/jobs/${jobId}/quiz`, payload);
  }

  setQuizVisibility(jobId: number, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.api}/recruiter/jobs/${jobId}/quiz/visibility`, {
      is_active: isActive,
    });
  }

  deleteQuizForJob(jobId: number): Observable<any> {
    return this.http.delete(`${this.api}/recruiter/jobs/${jobId}/quiz`);
  }

  getApplicationQuizAnswers(applicationId: number): Observable<any> {
    return this.http.get(`${this.api}/recruiter/ats/applications/${applicationId}/quiz-answers`);
  }
}
