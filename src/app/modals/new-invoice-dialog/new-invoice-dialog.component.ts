import { NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';


@Component({
  selector: 'app-new-invoice-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatDialogModule,
    MatNativeDateModule,
  ],
  templateUrl: './new-invoice-dialog.component.html',
  styleUrl: './new-invoice-dialog.component.scss'
})
export class NewInvoiceDialogComponent {
  provider = '';
  amount: number | null = null;
  date: Date | null = new Date();
  type = '';
  file: File | null = null;

  constructor(
    private dialogRef: MatDialogRef<NewInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  save() {
    if (!this.provider || !this.amount || !this.date || !this.type) return;

    this.dialogRef.close({
      provider: this.provider,
      amount: this.amount,
      date: this.date,
      type: this.type,
      file: this.file
    });
  }

  close() {
    this.dialogRef.close(null);
  }

}
