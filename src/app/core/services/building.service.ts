import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Building {
    id: string;
    name: string;
}

@Injectable({
    providedIn: 'root',
})
export class BuildingService {
    private buildings$ = new BehaviorSubject<Building[]>([
        { id: 'building-1', name: 'Edificio A' },
    ]);

    getBuildings() {
        return this.buildings$.asObservable();
    }

    addBuilding(name: string) {
        const newBuilding: Building = {
            id: crypto.randomUUID(),
            name,
        };

        this.buildings$.next([...this.buildings$.value, newBuilding]);
    }
}