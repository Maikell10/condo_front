import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OwnerProfileComponent } from './owner-profile.component';

@Component({
  selector: 'app-owner-profile-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, OwnerProfileComponent],
  template: `
    <h2 mat-dialog-title>Mis datos</h2>
    <p class="owner-profile-dialog__lead">Completa tu información. El rol del sistema no se edita aquí.</p>
    <mat-dialog-content>
      <app-owner-profile presentation="dialog" (saved)="close()" />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Ahora no</button>
    </mat-dialog-actions>
  `,
  styles: `
    .owner-profile-dialog__lead {
      margin: 0 1.5rem 0.5rem;
      color: #64748b;
      font-size: 0.9rem;
    }
  `
})
export class OwnerProfileDialogComponent {
  private dialogRef = inject(MatDialogRef<OwnerProfileDialogComponent>);

  close(): void {
    this.dialogRef.close();
  }
}
