import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { API_URL_BASE } from '../constants';

export interface Apartment {
    id: string;
    buildingId: string;
    number: string;
    ownerName: string;
    ownerCode: string; // único global
}

@Injectable({ providedIn: 'root' })
export class ApartmentService {
    private http = inject(HttpClient);
    private readonly API_URL = API_URL_BASE + '/api/apartments';

    getApartments(buildingId: number): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/building/${buildingId}`);
    }

    updateAlicuota(id: number, alicuota: number): Observable<any> {
        return this.http.patch(`${this.API_URL}/${id}/alicuota`, { alicuota });
    }

    // Busca usuarios por nombre o correo para el modal de vinculación
    searchUsers(term: string): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${API_URL_BASE}/api/users/search?term=${term}`);
    }

    // Vincula el usuario al apartamento
    linkOwner(apartmentId: number, userId: number): Observable<any> {
        return this.http.patch(`${this.API_URL}/${apartmentId}/owner`, { userId });
    }

    createApartment(data: { number: string; alicuota: number; buildingId: number }): Observable<any> {
        return this.http.post(`${this.API_URL}`, data);
    }





    private apartments$ = new BehaviorSubject<Apartment[]>([
        {
            id: 'apartment-1',
            buildingId: 'building-1',
            number: '101',
            ownerName: 'Juan Pérez',
            ownerCode: 'APT-0001-UNICO',
        },
    ]);

    // getApartments() {
    //     return this.apartments$.asObservable();
    // }

    addApartment(buildingId: string, number: string, ownerName: string) {
        const newApartment: Apartment = {
            id: crypto.randomUUID(),
            buildingId,
            number,
            ownerName,
            ownerCode: this.generateUniqueCode(),
        };

        this.apartments$.next([...this.apartments$.value, newApartment]);
    }

    private generateUniqueCode(): string {
        const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        return `APT-${random}`;
    }
}