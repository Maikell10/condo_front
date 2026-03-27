import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuditService } from '../../../core/services/audit.service';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, JsonPipe, MatCardModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule],
  templateUrl: './audit.component.html'
})
export class AuditComponent implements OnInit {
  private auditService = inject(AuditService);
  private fb = inject(FormBuilder);

  events = signal<any[]>([]);
  displayedColumns = ['timestamp', 'user', 'role', 'action', 'module', 'payload'];

  // Formulario de filtros reactivos
  filterForm = this.fb.group({
    user: [''],
    action: [''],
    module: [''],
    date: ['']
  });

  ngOnInit() {
    this.loadLogs();
    // Escuchar cambios en filtros para recargar automáticamente
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => this.loadLogs());
  }

  loadLogs() {
    this.auditService.getLogs(this.filterForm.value).subscribe(res => {
      this.events.set(res.data);
    });
  }
}