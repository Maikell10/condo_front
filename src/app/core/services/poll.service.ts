import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL_BASE } from '../constants';

@Injectable({ providedIn: 'root' })
export class PollService {
  private http = inject(HttpClient);
  private apiUrl = API_URL_BASE + '/api';

  // getPollsByBuilding(buildingId: number) {
  //   return this.http.get<any>(`${this.apiUrl}/polls/building/${buildingId}`);
  // }

  getPollsByBuilding(buildingId: number, apartmentId?: number) {
    let params = new HttpParams();

    if (apartmentId) {
      params = params.set('apartmentId', apartmentId.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/polls/building/${buildingId}`, { params });
  }

  createPoll(payload: { buildingId: number, question: string, durationDays: number }) {
    return this.http.post<any>(`${this.apiUrl}/polls`, payload);
  }

  getPollResults(pollId: number) {
    return this.http.get<any>(`${this.apiUrl}/polls/${pollId}/results`);
  }

  castVote(payload: { pollId: number, apartmentId: number, vote: string }) {
    return this.http.post<any>(`${this.apiUrl}/polls/vote`, payload);
  }
}