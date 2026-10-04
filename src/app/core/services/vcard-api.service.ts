import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL_BASE } from '../constants';
import { StoredVCard, VCardUsage } from '../contact/vcard.models';
import { VCardProfile } from '../contact/vcard.models';

export interface VCardSavePayload {
  label: string;
  usage: VCardUsage;
  contact: VCardProfile;
  isPublished?: boolean;
}

@Injectable({ providedIn: 'root' })
export class VCardApiService {
  private http = inject(HttpClient);
  private readonly base = `${API_URL_BASE}/api/vcards`;

  list(): Observable<{ data: StoredVCard[] }> {
    return this.http.get<{ data: StoredVCard[] }>(this.base);
  }

  getPublic(id: number | string): Observable<{ data: StoredVCard }> {
    return this.http.get<{ data: StoredVCard }>(`${this.base}/public/${id}`);
  }

  create(payload: VCardSavePayload): Observable<{ data: StoredVCard }> {
    return this.http.post<{ data: StoredVCard }>(this.base, payload);
  }

  update(id: number, payload: VCardSavePayload): Observable<{ data: StoredVCard }> {
    return this.http.put<{ data: StoredVCard }>(`${this.base}/${id}`, payload);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
