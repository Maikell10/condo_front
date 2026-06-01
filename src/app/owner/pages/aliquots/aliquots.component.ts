import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApartmentService } from '../../../core/services/apartment.service'; // Ajusta la ruta a tu servicio
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-aliquots',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
    templateUrl: './aliquots.component.html' // Lo pasamos a archivo externo por limpieza
})
export class AliquotsComponent implements OnInit {
    private apartmentService = inject(ApartmentService);
    private authService = inject(AuthService);

    // Eliminamos 'area'
    displayedColumns: string[] = ['unit', 'owner', 'percentage'];
    aliquots = signal<any[]>([]);

    ngOnInit() {
        this.loadAliquots();
    }

    loadAliquots() {
        const user = this.authService.userSignal();
        const buildingId = user?.buildingId;
        const myUserId = Number(user?.id); // Para saber qué filas son mías

        if (buildingId) {
            this.apartmentService.getAliquots(Number(buildingId)).subscribe({
                next: (res: any) => {
                    // Mapeamos los datos para adaptarlos a la tabla y saber cuál es mi apartamento
                    const formattedData = res.data.map((apt: any) => ({
                        unit: apt.unit,
                        owner: apt.ownerName || 'Sin asignar',
                        // Multiplicamos por 100 porque en BD está como 0.4000
                        percentage: parseFloat(apt.alicuota) * 100,
                        isMe: apt.ownerId === myUserId
                    }));

                    this.aliquots.set(formattedData);
                },
                error: (err) => console.error("Error al cargar alícuotas", err)
            });
        }
    }
}