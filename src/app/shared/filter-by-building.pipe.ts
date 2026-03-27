import { Pipe, PipeTransform } from '@angular/core';
import { Apartment } from '../core/services/apartment.service';

@Pipe({
    name: 'filterByBuilding',
    standalone: true,
})
export class FilterByBuildingPipe implements PipeTransform {
    transform(apartments: Apartment[], buildingId: string) {
        return apartments.filter(a => a.buildingId === buildingId);
    }
}