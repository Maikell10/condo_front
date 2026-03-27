import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BillingService } from '../../../core/services/billing.service';

@Component({
  selector: 'app-add-expense-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title class="font-bold text-indigo-900 text-xl border-b pb-2">Registrar Gasto del Edificio</h2>
    <mat-dialog-content class="pt-4">
      <form [formGroup]="expenseForm" class="flex flex-col gap-4">
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Concepto del Gasto (Catálogo)</mat-label>
          <mat-select formControlName="conceptId">
            @for (c of concepts(); track c.id) {
              <mat-option [value]="c.id">
                <span class="font-mono text-indigo-600">[{{ c.code }}]</span> {{ c.description }}
              </mat-option>
            }
          </mat-select>
          <mat-hint>Si no aparece el concepto, contacte al Super Admin</mat-hint>
        </mat-form-field>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Fecha del comprobante</mat-label>
            <input matInput type="date" formControlName="expenseDate">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Monto Facturado ($)</mat-label>
            <input matInput type="number" formControlName="amount" placeholder="0.00">
            <span matPrefix class="mr-1">$</span>
          </mat-form-field>
        </div>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-4 border-t">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" 
              class="px-6"
              [disabled]="expenseForm.invalid" 
              (click)="save()">
        Cargar al Mes
      </button>
    </mat-dialog-actions>
  `
})
export class AddExpenseModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private billingService = inject(BillingService);
  public dialogRef = inject(MatDialogRef<AddExpenseModalComponent>);

  concepts = signal<any[]>([]);

  expenseForm: FormGroup = this.fb.group({
    conceptId: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(0.01)]],
    expenseDate: [new Date().toISOString().split('T')[0], Validators.required]
  });

  ngOnInit() {
    // 🔥 Carga real desde la base de datos
    this.billingService.getConcepts().subscribe({
      next: (res) => {
        this.concepts.set(res.data);
      },
      error: (err) => {
        console.error('Error al cargar catálogo:', err);
        alert('No se pudo cargar el catálogo de conceptos.');
      }
    });
  }

  save() {
    if (this.expenseForm.valid) {
      // Enviamos el objeto al componente padre
      this.dialogRef.close(this.expenseForm.value);
    }
  }
}