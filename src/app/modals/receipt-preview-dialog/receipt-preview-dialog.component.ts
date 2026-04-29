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
                    <h1 class="text-4xl font-black text-[#0d3b66] m-0 tracking-tighter" style="font-family: Arial, sans-serif;">CONDO MANAGER</h1>
                    <p class="text-[10px] font-bold text-gray-800 m-0">ADMINISTRADORA DE INMUEBLES</p>
                    <p class="text-[10px] font-bold text-gray-800 m-0">RIF: J-29626110-5</p>
                </div>
                <div class="border rounded-xl border-gray-400 p-2 text-center text-xs min-w-[280px]">
                    <p class="font-bold m-0 text-sm">Banco MERCANTIL</p>
                    <p class="m-0">Cuenta Corriente 01050039751039366716</p>
                    <p class="font-bold mt-2 m-0 text-sm">J-296261105</p>
                    <p class="m-0 font-bold">Clave web: 111111111</p>
                </div>
            </div>

            <div class="bg-[#0d3b66] text-white text-center font-bold text-sm py-1 mb-1">
                Condominios - Alquileres - Ventas
            </div>

            <div class="grid grid-cols-4 border-2 border-[#0d3b66] text-[11px]">
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">EDIFICIO</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">APTO</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">EMISIÓN</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-[#0d3b66]">MES/AÑO</div>
                
                <div class="font-bold text-center border-b border-r border-[#0d3b66]">{{ data.buildingName }}</div>
                <div class="font-bold text-center border-b border-r border-[#0d3b66]">{{ data.unit }}</div>
                <div class="font-bold text-center border-b border-r border-[#0d3b66]">{{ data.issueDate }}</div>
                <div class="font-bold text-center border-b border-[#0d3b66]">{{ data.monthYear }}</div>

                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">PROPIETARIO</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">ALICUOTA</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-r border-[#0d3b66]">DEUDA ACUMULADA</div>
                <div class="bg-[#0d3b66] text-white px-1 font-bold border-b border-[#0d3b66]">MONTO Bs.</div>

                <div class="font-bold text-center border-r border-[#0d3b66]">{{ data.ownerName }}</div>
                <div class="font-bold text-center border-r border-[#0d3b66]">{{ data.quota }}</div>
                <div class="font-bold text-center border-r border-[#0d3b66]"></div> <div class="font-bold text-center text-sm">{{ data.totalBill | number:'1.2-2' }}</div>
            </div>

            <div class="mt-1 border-2 border-[#0d3b66] min-h-[400px] flex flex-col relative">
                
                <div class="grid grid-cols-12 bg-[#0d3b66] text-white text-[11px] font-bold">
                    <div class="col-span-8 px-1 border-r border-white">CONCEPTO DE GASTO</div>
                    <div class="col-span-2 text-center border-r border-white">GASTO COMÚN</div>
                    <div class="col-span-2 text-center">G. INDIVIDUAL</div>
                </div>

                <div class="flex-1 text-[10px]">
                    <ng-container *ngFor="let item of data.lineItems">
                        <div class="grid grid-cols-12 hover:bg-gray-50">
                            <div class="col-span-8 px-1 border-r border-[#0d3b66]/30 uppercase">{{ item.concept }}</div>
                            <div class="col-span-2 text-right pr-2 border-r border-[#0d3b66]/30">{{ item.commonExpense | number:'1.2-2' }}</div>
                            <div class="col-span-2 text-right pr-2">{{ item.individualShare | number:'1.2-2' }}</div>
                        </div>
                    </ng-container>

                    <div class="grid grid-cols-12 mt-4">
                        <div class="col-span-8 px-1 border-r border-[#0d3b66]/30 uppercase">TOTAL GASTOS COMUNES:</div>
                        <div class="col-span-2 text-right pr-2 border-r border-[#0d3b66]/30">{{ data.totalGastoComun | number:'1.2-2' }}</div>
                        <div class="col-span-2 text-right pr-2">{{ data.totalGastoIndividual | number:'1.2-2' }}</div>
                    </div>

                    <div class="grid grid-cols-12 mt-4">
                        <div class="col-span-8 px-1 border-r border-[#0d3b66]/30 uppercase">FDO DE RESERVA</div>
                        <div class="col-span-2 text-right pr-2 border-r border-[#0d3b66]/30">{{ data.totalFondosComun | number:'1.2-2' }}</div>
                        <div class="col-span-2 text-right pr-2">{{ data.totalFondosIndividual | number:'1.2-2' }}</div>
                    </div>

                    <div class="grid grid-cols-12 mt-4 font-bold">
                        <div class="col-span-8 px-1 border-r border-[#0d3b66]/30 uppercase">TOTAL FONDOS:</div>
                        <div class="col-span-2 text-right pr-2 border-r border-[#0d3b66]/30">{{ data.totalFondosComun | number:'1.2-2' }}</div>
                        <div class="col-span-2 text-right pr-2">{{ data.totalFondosIndividual | number:'1.2-2' }}</div>
                    </div>

                    <div class="grid grid-cols-12">
                        <div class="col-span-8 px-1 border-r border-[#0d3b66]/30 uppercase">TOTAL FONDOS Y GASTOS COMUNES:</div>
                        <div class="col-span-2 text-right pr-2 border-r border-[#0d3b66]/30">{{ (data.totalGastoComun + data.totalFondosComun) | number:'1.2-2' }}</div>
                        <div class="col-span-2 text-right pr-2">{{ data.totalBill | number:'1.2-2' }}</div>
                    </div>
                    
                    <div class="grid grid-cols-12">
                        <div class="col-span-8 px-1 border-r border-[#0d3b66]/30 uppercase">GASTOS COMUNES SEGÚN ALICUOTA:</div>
                        <div class="col-span-2 text-right pr-2 border-r border-[#0d3b66]/30"></div>
                        <div class="col-span-2 text-right pr-2">{{ data.totalBill | number:'1.2-2' }}</div>
                    </div>
                </div>

                <div class="absolute bottom-2 left-2 text-5xl font-black text-[#c85a2b] opacity-80" style="font-family: Arial, sans-serif;">
                    AVISO DE COBRO
                </div>
            </div>

            <div class="text-[8px] font-bold text-right py-0.5">REFERENCIA CALCULO DEL RECIBO DE CONDOMINIO SEGUN TASA DICOM DEL BCV BS. 433,17 ... TASA DEL BCV 185,13 $</div>
            
            <div class="border-2 border-[#0d3b66] text-[10px] mb-2">
                <div class="grid grid-cols-5 bg-[#0d3b66] text-white font-bold">
                    <div class="col-span-2 px-1 border-r border-white">CONCEPTO</div>
                    <div class="text-center border-r border-white">SALDO INICIO</div>
                    <div class="text-center border-r border-white">GASTOS</div>
                    <div class="text-center border-r border-white">APORTES</div>
                    <div class="text-center">SALDO FINAL</div>
                </div>
                <div class="grid grid-cols-5 border-b border-[#0d3b66]/30">
                    <div class="col-span-2 px-1 uppercase">FDO DE RESERVA</div>
                    <div class="text-right pr-1">240.593,54</div>
                    <div class="text-right pr-1">0,00</div>
                    <div class="text-right pr-1">58.273,75</div>
                    <div class="text-right pr-1">298.867,29</div>
                </div>
                <div class="grid grid-cols-5 border-b border-[#0d3b66]/30">
                    <div class="col-span-2 px-1 uppercase">FDO TRABAJO</div>
                    <div class="text-right pr-1">139.146,88</div>
                    <div class="text-right pr-1">0,00</div>
                    <div class="text-right pr-1">0,00</div>
                    <div class="text-right pr-1">139.146,88</div>
                </div>
                <div class="grid grid-cols-5">
                    <div class="col-span-2 px-1 uppercase">FDO DIFERENCIAL CAMBIARIO</div>
                    <div class="text-right pr-1">373.044,33</div>
                    <div class="text-right pr-1">0,00</div>
                    <div class="text-right pr-1">0,00</div>
                    <div class="text-right pr-1">373.044,33</div>
                </div>
            </div>

            <div class="bg-[#0d3b66] text-white text-center text-[10px] py-2 mt-auto">
                Av. José A. Páez. Centro Profesional El Paraíso. Piso 2. Ofic. 208. Urb. El Paraíso. Telf. (0212) 461-4347/451-6751/915-6101<br>
                Web: www.condomanager.com. E-mails: admin&#64;condomanager.com
            </div>
            
            <div class="absolute right-[-140px] top-[40%] transform -rotate-90 origin-left text-[9px] w-[400px]">
                - El pago de este recibo NO implica solvencia. - Los cheques devueltos tendrán un recargo. Este recibo debe ser pagado en los siete (7) días consecutivos a su emisión.
            </div>

        </div>
    </mat-dialog-content>
  `,
    styles: [`
    .receipt-a4 {
        width: 210mm; /* Formato A4 exacto */
        min-height: 297mm;
        padding: 15mm;
        box-sizing: border-box;
    }
    
    /* Configuración clave para la impresión */
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
        window.print(); // Abre el diálogo nativo de impresión del navegador
    }
}