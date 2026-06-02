import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BillingService } from '../../../core/services/billing.service';

@Component({
  selector: 'app-add-expense-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title class="font-bold text-indigo-900 text-xl border-b pb-2">Registrar Gasto del Edificio</h2>
    
    <mat-dialog-content class="pt-4">
      <form [formGroup]="expenseForm" class="flex flex-col gap-4">
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Concepto del Gasto (Catálogo)</mat-label>
          <mat-select formControlName="conceptId" panelClass="custom-select-panel">
            
            <div class="p-2 sticky top-0 bg-white z-10 border-b flex items-center gap-2" (click)="$event.stopPropagation()">
              <mat-icon class="text-gray-400 text-sm w-4 h-4">search</mat-icon>
              
              <input #searchBox matInput placeholder="Buscar o escribir concepto..." 
                     (input)="searchText.set(searchBox.value)" 
                     (keydown)="$event.stopPropagation()" 
                     class="w-full text-sm p-1 outline-none border-none bg-transparent">
            </div>

            @for (c of filteredConcepts(); track c.id) {
              <mat-option [value]="c.id">
                <span class="font-mono text-indigo-600 font-bold mr-2">[{{ c.code }}]</span> {{ c.description }}
              </mat-option>
            }

            @if (filteredConcepts().length === 0 && searchText()) {
              <div class="p-4 text-center border-t bg-slate-50/50" (click)="$event.stopPropagation()">
                <p class="text-xs text-gray-500 mb-2">No se encontró "{{ searchText() }}" en el catálogo.</p>
                <button type="button" mat-flat-button color="accent" class="text-xs font-black rounded-lg h-9"
                        (click)="createNewConcept(searchText())">
                  <mat-icon class="mr-1 scale-75">add_circle</mat-icon> CREAR E INYECTAR CONCEPTO
                </button>
              </div>
            }

          </mat-select>
          <mat-hint>Si no aparece, escribe el término para agregarlo al catálogo.</mat-hint>
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
      <button mat-flat-button color="primary" class="px-6 rounded-xl font-bold" 
              [disabled]="expenseForm.invalid" (click)="save()">
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
  searchText = signal<string>('');

  filteredConcepts = computed(() => {
    const query = this.searchText().toLowerCase().trim();
    if (!query) return this.concepts();
    return this.concepts().filter(c =>
      c.description.toLowerCase().includes(query) || c.code.includes(query)
    );
  });

  expenseForm: FormGroup = this.fb.group({
    conceptId: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(0.01)]],
    expenseDate: [new Date().toISOString().split('T')[0], Validators.required]
  });

  ngOnInit() {
    this.loadCatalog();
  }

  loadCatalog(selectNewId?: number) {
    this.billingService.getConcepts().subscribe({
      next: (res) => {
        this.concepts.set(res.data);
        if (selectNewId) {
          this.expenseForm.patchValue({ conceptId: selectNewId });
        }
      },
      error: (err) => console.error('Error al cargar catálogo:', err)
    });
  }

  // 🔥 FIX 2: Función inteligente para formatear textos con iniciales mayúsculas
  capitalizePhrase(str: string): string {
    const minorWords = ['de', 'del', 'la', 'las', 'lo', 'los', 'en', 'y', 'a', 'por', 'para', 'con'];
    return str
      .toLowerCase()
      .trim()
      .split(/\s+/) // Separa por cualquier cantidad de espacios
      .map((word, index) => {
        // Capitaliza siempre la primera palabra, o cualquier palabra que no sea una preposición corta
        if (index === 0 || !minorWords.includes(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join(' ');
  }

  createNewConcept(rawDescription: string) {
    // Aplicamos el formateador de mayúsculas antes de procesar
    const formattedDescription = this.capitalizePhrase(rawDescription);

    const confirmation = confirm(`¿Deseas agregar "${formattedDescription}" como un nuevo concepto oficial al catálogo general del sistema?`);

    if (confirmation) {
      this.billingService.createConcept({ description: formattedDescription }).subscribe({
        next: (res: any) => {
          alert(`Éxito: Se ha generado el código [${res.data.code}] para este nuevo concepto.`);
          this.searchText.set('');
          this.loadCatalog(res.data.id);
        },
        error: (err) => alert('Error al registrar en el catálogo: ' + err.error?.message)
      });
    }
  }

  save() {
    if (this.expenseForm.valid) {
      this.dialogRef.close(this.expenseForm.value);
    }
  }
}