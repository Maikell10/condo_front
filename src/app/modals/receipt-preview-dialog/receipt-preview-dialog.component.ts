import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-receipt-preview-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    template: `
    <div class="flex items-center justify-between p-4 bg-gray-100 border-b print:hidden">
        <h2 class="text-lg font-bold text-gray-700 m-0">Vista Previa del Recibo</h2>
        <div class="flex gap-2">
            <button mat-button mat-dialog-close>Cerrar</button>
            <button mat-flat-button color="primary" (click)="print()">
                <mat-icon class="mr-2">print</mat-icon> Imprimir / PDF
            </button>
        </div>
    </div>

    <mat-dialog-content class="p-0 bg-gray-50 print:bg-white print:p-0">
        
        <div class="receipt-a4 bg-white mx-auto relative overflow-hidden" id="printable-receipt">
            
            <div class="flex justify-between items-start mb-2">
                <div class="flex flex-col">
                    <h1 class="text-2xl font-black text-[#0d3b66] m-0 tracking-tighter" style="font-family: Arial, sans-serif;">CONDOMINIO A UN CLIC</h1>
                    <p class="text-[10px] font-bold text-gray-800 m-0">ADMINISTRADORA DE INMUEBLES</p>
                    <!-- <p class="text-[10px] font-bold text-gray-800 m-0">RIF: J-29626110-5</p> -->
                </div>
                <div class="border rounded-xl border-gray-400 p-2 text-center text-xs min-w-[280px]">
                    <div class="h-14 w-auto flex items-center justify-center">
                        <img src="/LOGO_SN1.png" alt="Logo Condominio A Un Clic" class="h-full w-full object-contain mix-blend-multiply">
                    </div>
                    
                    <div class="bg-white px-4 py-1 rounded-md border shadow-sm">
                        <p class="m-0 font-bold text-xs text-[#0d3b66] uppercase tracking-wider">
                            Clave ingreso web: <span class="text-sm">{{ data.accessCode }}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div class="bg-[#0d3b66] text-white text-center font-bold text-sm py-1 mb-1 uppercase">
                {{ data.buildingName }} - Recibo de Condominio
            </div>

            <div class="grid grid-cols-4 border-2 border-[#0d3b66] text-[11px]">
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">EDIFICIO</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">APTO</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">EMISIÓN</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-[#0d3b66]">PERÍODO</div>
                
                <div class="font-bold text-center border-b border-r border-[#0d3b66] uppercase">{{ data.buildingName }}</div>
                <div class="font-bold text-center border-b border-r border-[#0d3b66]">{{ data.unit }}</div>
                <div class="font-bold text-center border-b border-r border-[#0d3b66]">{{ data.issueDate }}</div>
                <div class="font-bold text-center border-b border-[#0d3b66]">{{ data.monthYear }}</div>

                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">PROPIETARIO</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">ALÍCUOTA</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">ESTADO</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-[#0d3b66]">MONTO $</div>

                <div class="font-bold text-center border-r border-[#0d3b66] uppercase">{{ data.ownerName }}</div>
                <div class="font-bold text-center border-r border-[#0d3b66]">{{ data.quota }}</div>
                <div class="font-bold text-center border-r border-[#0d3b66] text-green-600">PAGADO</div> 
                <div class="font-bold text-center text-sm">{{ data.totalBill | number:'1.2-2' }}</div>
            </div>

            <div class="mt-1 border-2 border-[#0d3b66] min-h-[400px] flex flex-col relative">
                
                <div class="grid grid-cols-12 bg-[#0d3b66] text-white text-[11px] font-bold">
                    <div class="col-span-8 px-1 border-r border-white">CONCEPTO DE GASTO</div>
                    <div class="col-span-2 text-center border-r border-white">GASTO COMÚN $</div>
                    <div class="col-span-2 text-center">G. INDIVIDUAL $</div>
                </div>

                <div class="flex-1 text-[10px]">
                    <ng-container *ngFor="let item of data.lineItems">
                        <div class="grid grid-cols-12 hover:bg-gray-50 border-b border-gray-100">
                            <div class="col-span-8 px-2 py-1 border-r border-[#0d3b66]/30 uppercase">{{ item.concept }}</div>
                            <div class="col-span-2 text-right py-1 pr-2 border-r border-[#0d3b66]/30">{{ item.commonExpense | number:'1.2-2' }}</div>
                            <div class="col-span-2 text-right py-1 pr-2">{{ item.individualShare | number:'1.2-2' }}</div>
                        </div>
                    </ng-container>

                    <div class="grid grid-cols-12 mt-4 border-t border-[#0d3b66]/30">
                        <div class="col-span-8 px-2 py-1 border-r border-[#0d3b66]/30 uppercase font-bold text-right">TOTAL GASTOS:</div>
                        <div class="col-span-2 text-right py-1 pr-2 border-r border-[#0d3b66]/30 font-bold">{{ data.totalGastoComun | number:'1.2-2' }}</div>
                        <div class="col-span-2 text-right py-1 pr-2 font-bold">{{ data.totalGastoIndividual | number:'1.2-2' }}</div>
                    </div>
                    
                    <div class="grid grid-cols-12 mt-4 bg-gray-100 font-black text-sm border-y-2 border-[#0d3b66]">
                        <div class="col-span-10 px-2 py-2 border-r border-[#0d3b66] uppercase text-right">TOTAL A PAGAR:</div>
                        <div class="col-span-2 text-right py-2 pr-2 text-[#0d3b66]">{{ data.totalBill | number:'1.2-2' }}</div>
                    </div>
                </div>

                <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <h1 class="text-[120px] font-black text-green-600 transform -rotate-45 m-0" style="font-family: Arial, sans-serif;">
                        PAGADO
                    </h1>
                </div>
            </div>
            
            <div class="text-[8px] font-bold text-center py-2 text-gray-500">
                Documento emitido electrónicamente por Condominio a Un Clic.
            </div>

        </div>
    </mat-dialog-content>
  `,
    styles: [`
    .receipt-a4 {
        width: 210mm;
        min-height: 297mm;
        padding: 15mm;
        box-sizing: border-box;
    }
    
    @media print {
        body * {
            visibility: hidden;
        }
        #printable-receipt, #printable-receipt * {
            visibility: visible;
        }
        #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 10mm;
            width: 100%;
        }
    }
  `]
})
export class ReceiptPreviewDialogComponent {
    data = inject(MAT_DIALOG_DATA);
    dialogRef = inject(MatDialogRef);

    print() {
        window.print();
    }
}