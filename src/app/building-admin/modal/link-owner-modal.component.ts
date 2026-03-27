import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { ApartmentService } from '../../core/services/apartment.service';

@Component({
    selector: 'app-link-owner-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatButtonModule],
    template: `
    <h2 mat-dialog-title class="font-bold text-gray-800">Vincular Propietario - Apto {{ data.number }}</h2>
    <mat-dialog-content>
      <p class="text-sm text-gray-500 mb-4">Busca al usuario por nombre o correo electrónico para asignarlo a esta unidad.</p>
      
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Buscar Usuario</mat-label>
        <input matInput 
               [matAutocomplete]="auto" 
               [(ngModel)]="searchTerm" 
               (input)="onSearch()">
        <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn" (optionSelected)="selectedUser = $event.option.value">
          @for (user of users(); track user.id) {
            <mat-option [value]="user">
              <div class="flex flex-col">
                <span class="font-bold">{{ user.name }}</span>
                <span class="text-xs text-gray-400">{{ user.email }}</span>
              </div>
            </mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>

    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-4 border-t">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!selectedUser" (click)="confirm()">
        Vincular Propietario
      </button>
    </mat-dialog-actions>
  `
})
export class LinkOwnerModalComponent {
    public dialogRef = inject(MatDialogRef<LinkOwnerModalComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private apartmentService = inject(ApartmentService);

    searchTerm = '';
    users = signal<any[]>([]);
    selectedUser: any = null;

    onSearch() {
        if (this.searchTerm.length > 2) {
            this.apartmentService.searchUsers(this.searchTerm).subscribe({
                next: (res) => this.users.set(res.data),
                error: () => this.users.set([])
            });
        }
    }

    displayFn(user: any): string {
        return user ? user.name : '';
    }

    confirm() {
        this.dialogRef.close(this.selectedUser.id);
    }
}