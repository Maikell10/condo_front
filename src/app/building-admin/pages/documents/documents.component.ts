import { Component, inject, OnInit, signal, computed, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'; // 🔥 Añadido para el Modal
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // 🔥 Añadido para el Modal
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ApartmentService } from '../../../core/services/apartment.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatFormFieldModule, FormsModule, MatInputModule, MatDialogModule
  ],
  templateUrl: './documents.component.html'
})
export class DocumentsComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private apartmentService = inject(ApartmentService);
  private dialog = inject(MatDialog); // Inyectamos el servicio de modales

  // 🔥 Referencia al modal en el HTML
  @ViewChild('docParamsDialog') docParamsDialog!: TemplateRef<any>;

  documentTypes = [
    { id: 'residencia', name: 'Carta de Residencia', icon: 'home_work', desc: 'Constancia de habitabilidad en el edificio.' },
    { id: 'conducta', name: 'Carta de Buena Conducta', icon: 'verified_user', desc: 'Aval de comportamiento cívico en la comunidad.' },
    { id: 'solvencia', name: 'Solvencia de Condominio', icon: 'price_check', desc: 'Certificado de estar al día con los pagos.' }
  ];

  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  apartmentsList = signal<any[]>([]);

  selectedDoc = signal<string>('');
  selectedBuildingId = signal<number | null>(null);
  selectedAptId = signal<number | null>(null);

  selectedOwner = computed(() => {
    if (!this.selectedAptId()) return null;
    return this.apartmentsList().find(a => a.id === this.selectedAptId());
  });

  selectedDocObj = computed(() => {
    return this.documentTypes.find(d => d.id === this.selectedDoc());
  });

  // Datos dinámicos para los modales
  docData = {
    cedula: '',
    tiempoResidencia: ''
  };

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.authService.userSignal();
    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => this.buildingsList.set(res.data)
      });
    } else if (user?.buildingId) {
      this.selectedBuildingId.set(Number(user.buildingId));
      this.loadApartments(Number(user.buildingId));
    }
  }

  onBuildingChange(buildingId: number) {
    this.selectedBuildingId.set(buildingId);
    this.selectedAptId.set(null);
    this.loadApartments(buildingId);
  }

  loadApartments(buildingId: number) {
    this.apartmentService.getApartments(buildingId).subscribe({
      next: (res: any) => {
        const sortedApts = res.data.sort((a: any, b: any) => a.number.localeCompare(b.number, undefined, { numeric: true }));
        this.apartmentsList.set(sortedApts);
      },
      error: (err) => console.error("Error cargando apartamentos", err)
    });
  }

  // Se ejecuta al hacer clic en "Generar e Imprimir"
  generateDocument() {
    // Reseteamos las variables del formulario emergente
    this.docData.cedula = '';
    this.docData.tiempoResidencia = '';

    // Ahora todos los documentos usan el mismo modal, el HTML oculta campos si es necesario
    this.dialog.open(this.docParamsDialog, { width: '400px' });
  }

  // Se ejecuta al confirmar los datos en el modal
  confirmAndPrintDocument() {
    this.dialog.closeAll();

    const docType = this.selectedDoc();
    const ownerData = this.selectedOwner();
    const building = this.buildingsList().find(b => b.id === this.selectedBuildingId());
    const buildingName = building ? building.name : 'Edificio Único';

    let htmlContent = '';

    // Elegimos la plantilla según el documento seleccionado
    if (docType === 'conducta') {
      htmlContent = this.getConductaHTMLTemplate(
        ownerData.ownerName, this.docData.cedula, buildingName, ownerData.number, this.docData.tiempoResidencia
      );
    } else if (docType === 'residencia') {
      htmlContent = this.getResidenciaHTMLTemplate(
        ownerData.ownerName, this.docData.cedula, buildingName, ownerData.number, this.docData.tiempoResidencia
      );
    } else if (docType === 'solvencia') {
      htmlContent = this.getSolvenciaHTMLTemplate(
        ownerData.ownerName, this.docData.cedula, buildingName, ownerData.number
      );
    }

    // Proceso de impresión
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 200);
    }
  }

  // Generador Inteligente del Documento HTML (Carta de Buena Conducta)
  private getConductaHTMLTemplate(ownerName: string, cedula: string, buildingName: string, aptNumber: string, tiempoResidencia: string): string {
    const today = new Date();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dia = today.getDate();
    const mes = meses[today.getMonth()];
    const anio = today.getFullYear();

    return `
      <html>
        <head>
          <title>Carta de Buena Conducta - ${ownerName}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 40px 60px; line-height: 1.8; text-align: justify; }
            .title { text-align: center; font-weight: bold; font-size: 20px; text-decoration: underline; margin-bottom: 40px; }
            .signature { margin-top: 100px; text-align: center; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 0 auto 10px auto; }
            strong { text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="title">CARTA DE BUENA CONDUCTA</div>
          <p>
            Quienes suscribimos ciudadanos miembros de la Junta de Condominio del Conjunto Residencial "Leopoldo Martínez Olavarría", ubicado en la avenida principal de Parque Alto, Parroquia Guatire, Municipio Zamora del Estado Miranda.
          </p>
          <p>
            Por medio de la presente carta hacemos constar que el ciudadano(a) <strong>${ownerName}</strong>, titular de la cédula de identidad <strong>${cedula}</strong>, y quien reside en el Edificio <strong>${buildingName}</strong>, Apartamento <strong>${aptNumber}</strong>, es una persona cumplidora de los deberes establecidos en el Documento de Condominio y su Reglamento, rige la vida comunitaria del condominio, y a quien conocemos en calidad de residente desde hace <strong>${tiempoResidencia}</strong>, tiempo en el cual nunca ha demostrado una conducta hostil o fuera de las regulaciones jurídicas y legales vigentes en el Conjunto Residencial que afecten su convivencia pacífica y democrática. De tal forma, dejamos constancia de su buena, sana y transparente conducta, acorde con las buenas costumbres y la moral contenidas en la legislación venezolana.
          </p>
          <p style="margin-top: 30px;">
            Constancia que se expide a petición de la parte interesada a los ${dia} días del mes de ${mes} de ${anio}.
          </p>
          <p style="margin-top: 40px;">
            Atentamente,
          </p>
          <div class="signature">
            <div class="signature-line"></div>
            <strong>JOSE RAFAEL ORELLANA SALCEDO</strong><br>
            Presidente
          </div>
        </body>
      </html>
    `;
  }

  // Generador Inteligente para: CARTA DE RESIDENCIA
  private getResidenciaHTMLTemplate(ownerName: string, cedula: string, buildingName: string, aptNumber: string, tiempoResidencia: string): string {
    const today = new Date();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dia = today.getDate();
    const mes = meses[today.getMonth()];
    const anio = today.getFullYear();

    return `
      <html>
        <head>
          <title>Carta de Residencia - ${ownerName}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 40px 60px; line-height: 1.8; text-align: justify; }
            .title { text-align: center; font-weight: bold; font-size: 20px; text-decoration: underline; margin-bottom: 40px; }
            .signature { margin-top: 80px; text-align: center; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 0 auto 5px auto; }
            .footer { margin-top: 60px; font-size: 11px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
            strong { text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="title">CARTA DE RESIDENCIA</div>
          <p>
            Quienes suscribimos ciudadanos miembros de la Junta de Condominio del Conjunto Residencial "Leopoldo Martínez Olavarría", ubicado en la Avenida Principal de Parque Alto, Parroquia Guatire, Estado Miranda.
          </p>
          <p>
            Por medio de la presente carta hacemos constar que el (la) ciudadano(a) <strong>${ownerName}</strong>, portador de la C.I. <strong>${cedula}</strong>, reside en esta urbanización en el Edificio <strong>${buildingName}</strong>, Apartamento <strong>${aptNumber}</strong>, desde hace <strong>${tiempoResidencia}</strong>.
          </p>
          <p style="margin-top: 30px;">
            Constancia que se expide a petición de la parte interesada a los ${dia} días del mes de ${mes} de ${anio}.
          </p>
          <p style="margin-top: 40px;">
            Atentamente,
          </p>
          <div class="signature">
            <strong>Junta de Condominio</strong><br><br><br><br>
            <div class="signature-line"></div>
            <strong>José Orellana</strong><br>
            Presidente
          </div>
          
          <div class="footer">
            Conjunto Residencial Leopoldo Martínez Olavarría, Sector El Ingenio, Avenida Ppal. Parque Alto, Oficina de Condominio Ubicada entre los Edificios 1 y 3. Teléfono fijo: 0212-347-64-19 / Teléfono Celular: 0414-2009820
          </div>
        </body>
      </html>
    `;
  }

  // Generador Inteligente para: SOLVENCIA DE PAGO DE CONDOMINIO
  private getSolvenciaHTMLTemplate(ownerName: string, cedula: string, buildingName: string, aptNumber: string): string {
    const today = new Date();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    // Array para convertir el día en texto (Ej: 10 -> diez)
    const numerosTexto = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta', 'treinta y un'];

    const diaNum = today.getDate();
    const diaTexto = numerosTexto[diaNum];
    const mes = meses[today.getMonth()];
    const anio = today.getFullYear();

    return `
      <html>
        <head>
          <title>Solvencia de Condominio - ${ownerName}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 40px 60px; line-height: 1.8; text-align: justify; }
            .header-text { margin-bottom: 30px; }
            .title { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 5px; }
            .subtitle { text-align: center; font-weight: bold; font-size: 18px; letter-spacing: 4px; margin-bottom: 30px; }
            .signature { margin-top: 60px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin-bottom: 5px; }
            .footer-note { margin-top: 60px; font-size: 11px; text-align: justify; line-height: 1.4; }
            strong { text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header-text">Señor(es). A quien pueda interesar.</div>
          
          <div class="title">SOLVENCIA DE PAGO DE CONDOMINIO</div>
          <div class="subtitle">C O N S T A N C I A</div>
          
          <p>
            Quienes suscribimos ciudadanos miembros de la Junta de Condominio del Conjunto Residencial "LEOPOLDO MARTÍNEZ OLAVARRÍA", ubicado en la Avenida Principal Parque Alto del sector El Ingenio, Parroquia Guatire, Municipio Zamora, Estado Miranda.
          </p>
          <p>
            Por medio de la presente me dirijo a usted(es) en la oportunidad de hacer constar que al apartamento identificado con las letras/números: <strong>${buildingName}-${aptNumber}</strong>, que se encuentra ubicado en el Conjunto Residencial "Leopoldo Martínez Olavarría", Edif. <strong>${buildingName}</strong>, apartamento <strong>${aptNumber}</strong>, de la Av. Ppal. de Parque Alto, Sector El Ingenio, Municipio Zamora, Parroquia Guatire, Edo. Miranda; y cuyo propietario(s) es <strong>${ownerName}</strong> titular de la Cédula de Identidad <strong>${cedula}</strong>, no le es atribuible ningún gasto común ni particular de este condominio, y nada debe al condominio por ningún concepto, encontrándose en consecuencia, al día SOLVENTE en todos sus pagos hasta el mes de ${mes} del presente año.
          </p>
          <p style="margin-top: 20px;">
            SOLVENCIA DE PAGO DE CONDOMINIO que se expide a petición de la parte interesada, en la ciudad de Guatire, el día ${diaTexto} (${diaNum}) del mes de ${mes} de ${anio}.
          </p>
          
          <div class="signature">
            <p style="margin-bottom: 40px;">Firma conforme con su contenido;</p>
            <div class="signature-line"></div>
            <strong>José Orellana</strong><br>
            Presidente(a) de la Junta de Condominio
          </div>
          
          <div class="footer-note">
            <strong>Nota:</strong> Esta solvencia no constituye un instrumento legalmente reconocido oponible a terceros para evadir cualquier reclamación judicial o extrajudicial de deudas de condominios o de otros servicios que pudieron quedar pendientes en gestiones de las Juntas de Condominios anterior a esta fecha, atribuibles al propietario, ni representa un reconocimiento expreso de quien la firma de condonación alguna de lo que pudiera aparecer como debido. Se expide con base a la información contable disponible para la fecha por la Junta de Condominio.
          </div>
        </body>
      </html>
    `;
  }
}