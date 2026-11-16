import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AdminUserRow, displayUserEmail } from '../../admin/pages/users/admin-user.model';
import { OwnerProfileDialogComponent } from '../../owner/pages/profile/owner-profile-dialog.component';
import { ApartmentService } from './apartment.service';

const PROMPT_KEY = 'owner-profile-prompted';

export function isOwnerProfileComplete(row: AdminUserRow): boolean {
  const email = displayUserEmail(row.email, 'OWNER');
  return !!(
    row.cedula?.trim() &&
    row.phone?.trim() &&
    email &&
    (row.sex === 'M' || row.sex === 'F') &&
    row.birthDate
  );
}

@Injectable({ providedIn: 'root' })
export class OwnerProfileDialogService {
  private dialog = inject(MatDialog);
  private apartments = inject(ApartmentService);
  private ref: MatDialogRef<OwnerProfileDialogComponent> | null = null;

  open(): void {
    if (this.ref) return;
    this.ref = this.dialog.open(OwnerProfileDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      panelClass: 'owner-profile-dialog'
    });
    this.ref.afterClosed().subscribe(() => {
      this.ref = null;
    });
  }

  promptIfIncomplete(): void {
    if (sessionStorage.getItem(PROMPT_KEY)) return;
    this.apartments.getMyProfile().subscribe({
      next: (res) => {
        if (isOwnerProfileComplete(res.data)) return;
        sessionStorage.setItem(PROMPT_KEY, '1');
        this.open();
      }
    });
  }

  clearPrompt(): void {
    sessionStorage.removeItem(PROMPT_KEY);
  }
}
