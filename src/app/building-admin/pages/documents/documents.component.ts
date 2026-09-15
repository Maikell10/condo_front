import { Component, inject, OnInit, signal, computed, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
  private dialog = inject(MatDialog);

  @ViewChild('docParamsDialog') docParamsDialog!: TemplateRef<any>;

  documentTypes = [
    { id: 'residencia', name: 'Carta de Residencia', icon: 'home_work', desc: 'Constancia de habitabilidad en el conjunto.' },
    { id: 'conducta', name: 'Carta de Buena Conducta', icon: 'verified_user', desc: 'Aval de comportamiento cívico en la comunidad.' },
    { id: 'solvencia', name: 'Solvencia de Condominio', icon: 'price_check', desc: 'Certificado de estar al día con los pagos.' }
  ];

  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  adminName = computed(() => this.authService.userSignal()?.name || 'Junta de Condominio');
  buildingsList = signal<any[]>([]);
  apartmentsList = signal<any[]>([]);
  complexInfo = signal<{ name: string; direccion: string }>({ name: '', direccion: '' });

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

  selectedBuildingName = computed(() => {
    const building = this.buildingsList().find(b => b.id === this.selectedBuildingId());
    return building?.name || '';
  });

  canGenerate = computed(() => !!this.selectedDoc() && !!this.selectedOwner());

  docData = {
    cedula: '',
    tiempoResidencia: ''
  };

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.authService.userSignal();
    this.loadComplexInfo();

    this.dashboardService.getBuildingsByComplex().subscribe({
      next: (res: any) => {
        const buildings = res.data || [];
        this.buildingsList.set(buildings);

        if (!user?.complexId) {
          const buildingId = user?.buildingId ? Number(user.buildingId) : buildings[0]?.id;
          if (buildingId) {
            this.selectedBuildingId.set(buildingId);
            this.loadApartments(buildingId);
          }
        }
      }
    });
  }

  loadComplexInfo() {
    this.dashboardService.getComplexInfo().subscribe({
      next: (res: any) => {
        this.complexInfo.set({
          name: (res.data?.name || '').trim(),
          direccion: (res.data?.direccion || '').trim()
        });
      },
      error: () => this.complexInfo.set({ name: '', direccion: '' })
    });
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

  generateDocument() {
    this.docData.cedula = '';
    this.docData.tiempoResidencia = '';
    this.dialog.open(this.docParamsDialog, { width: '440px', autoFocus: 'first-tabbable' });
  }

  confirmAndPrintDocument() {
    this.dialog.closeAll();

    const docType = this.selectedDoc();
    const ctx = this.getDocContext();
    let htmlContent = '';

    if (docType === 'conducta') {
      htmlContent = this.getConductaHTMLTemplate(ctx);
    } else if (docType === 'residencia') {
      htmlContent = this.getResidenciaHTMLTemplate(ctx);
    } else if (docType === 'solvencia') {
      htmlContent = this.getSolvenciaHTMLTemplate(ctx);
    }

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

  private getDocContext() {
    const ownerData = this.selectedOwner();
    const complexName = this.escapeHtml(this.complexInfo().name || 'este condominio');
    const direccion = this.escapeHtml(this.complexInfo().direccion);

    return {
      ownerName: this.escapeHtml(ownerData?.ownerName || ''),
      cedula: this.escapeHtml(this.docData.cedula),
      buildingName: this.escapeHtml(this.selectedBuildingName() || 'Edificio'),
      aptNumber: this.escapeHtml(ownerData?.number || ''),
      tiempoResidencia: this.escapeHtml(this.docData.tiempoResidencia),
      complexName,
      direccion,
      juntaIntro: this.buildJuntaIntro(complexName, direccion),
      signerName: this.escapeHtml(this.adminName())
    };
  }

  private buildJuntaIntro(complexName: string, direccion: string): string {
    const article = /^(el |la |los |las |conjunto|residencial|condominio)/i.test(complexName) ? 'del' : 'de';
    const location = direccion ? `, ubicado en ${direccion}` : '';
    return `Quienes suscribimos ciudadanos miembros de la Junta de Condominio ${article} ${complexName}${location}.`;
  }

  private escapeHtml(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private getPrintDate() {
    const today = new Date();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const numerosTexto = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta', 'treinta y un'];
    const diaNum = today.getDate();

    return {
      dia: diaNum,
      diaTexto: numerosTexto[diaNum] || String(diaNum),
      mes: meses[today.getMonth()],
      anio: today.getFullYear()
    };
  }

  private printStyles(): string {
    return `
      body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 40px 60px; line-height: 1.8; text-align: justify; }
      .title { text-align: center; font-weight: bold; font-size: 20px; text-decoration: underline; margin-bottom: 40px; }
      .signature { margin-top: 80px; text-align: center; }
      .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 0 auto 10px auto; }
      .footer { margin-top: 60px; font-size: 11px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
      strong { text-transform: uppercase; }
    `;
  }

  private getConductaHTMLTemplate(ctx: ReturnType<DocumentsComponent['getDocContext']>): string {
    const { dia, mes, anio } = this.getPrintDate();

    return `
      <html>
        <head>
          <title>Carta de Buena Conducta - ${ctx.ownerName}</title>
          <style>${this.printStyles()}</style>
        </head>
        <body>
          <div class="title">CARTA DE BUENA CONDUCTA</div>
          <p>${ctx.juntaIntro}</p>
          <p>
            Por medio de la presente carta hacemos constar que el ciudadano(a) <strong>${ctx.ownerName}</strong>, titular de la cédula de identidad <strong>${ctx.cedula}</strong>, y quien reside en el Edificio <strong>${ctx.buildingName}</strong>, Apartamento <strong>${ctx.aptNumber}</strong>, es una persona cumplidora de los deberes establecidos en el Documento de Condominio y su Reglamento, rige la vida comunitaria del condominio, y a quien conocemos en calidad de residente desde hace <strong>${ctx.tiempoResidencia}</strong>, tiempo en el cual nunca ha demostrado una conducta hostil o fuera de las regulaciones jurídicas y legales vigentes en el conjunto residencial que afecten su convivencia pacífica y democrática. De tal forma, dejamos constancia de su buena, sana y transparente conducta, acorde con las buenas costumbres y la moral contenidas en la legislación venezolana.
          </p>
          <p style="margin-top: 30px;">
            Constancia que se expide a petición de la parte interesada a los ${dia} días del mes de ${mes} de ${anio}.
          </p>
          <p style="margin-top: 40px;">Atentamente,</p>
          <div class="signature">
            <div class="signature-line"></div>
            <strong>${ctx.signerName}</strong><br>
            Presidente(a) de la Junta de Condominio
          </div>
        </body>
      </html>
    `;
  }

  private getResidenciaHTMLTemplate(ctx: ReturnType<DocumentsComponent['getDocContext']>): string {
    const { dia, mes, anio } = this.getPrintDate();
    const footer = ctx.direccion ? `${ctx.complexName}, ${ctx.direccion}` : ctx.complexName;

    return `
      <html>
        <head>
          <title>Carta de Residencia - ${ctx.ownerName}</title>
          <style>${this.printStyles()}</style>
        </head>
        <body>
          <div class="title">CARTA DE RESIDENCIA</div>
          <p>${ctx.juntaIntro}</p>
          <p>
            Por medio de la presente carta hacemos constar que el (la) ciudadano(a) <strong>${ctx.ownerName}</strong>, portador de la C.I. <strong>${ctx.cedula}</strong>, reside en ${ctx.complexName} en el Edificio <strong>${ctx.buildingName}</strong>, Apartamento <strong>${ctx.aptNumber}</strong>, desde hace <strong>${ctx.tiempoResidencia}</strong>.
          </p>
          <p style="margin-top: 30px;">
            Constancia que se expide a petición de la parte interesada a los ${dia} días del mes de ${mes} de ${anio}.
          </p>
          <p style="margin-top: 40px;">Atentamente,</p>
          <div class="signature">
            <strong>Junta de Condominio</strong><br><br><br><br>
            <div class="signature-line"></div>
            <strong>${ctx.signerName}</strong><br>
            Presidente(a)
          </div>
          <div class="footer">${footer}</div>
        </body>
      </html>
    `;
  }

  private getSolvenciaHTMLTemplate(ctx: ReturnType<DocumentsComponent['getDocContext']>): string {
    const { dia, diaTexto, mes, anio } = this.getPrintDate();
    const ubicacionInmueble = ctx.direccion
      ? `${ctx.complexName}, Edif. <strong>${ctx.buildingName}</strong>, apartamento <strong>${ctx.aptNumber}</strong>, ${ctx.direccion}`
      : `${ctx.complexName}, Edif. <strong>${ctx.buildingName}</strong>, apartamento <strong>${ctx.aptNumber}</strong>`;

    return `
      <html>
        <head>
          <title>Solvencia de Condominio - ${ctx.ownerName}</title>
          <style>
            ${this.printStyles()}
            .header-text { margin-bottom: 30px; }
            .subtitle { text-align: center; font-weight: bold; font-size: 18px; letter-spacing: 4px; margin-bottom: 30px; text-decoration: none; }
            .signature { margin-top: 60px; text-align: left; }
            .signature-line { margin: 0 0 5px 0; }
            .footer-note { margin-top: 60px; font-size: 11px; text-align: justify; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="header-text">Señor(es). A quien pueda interesar.</div>
          <div class="title" style="text-decoration: none; margin-bottom: 5px;">SOLVENCIA DE PAGO DE CONDOMINIO</div>
          <div class="subtitle">C O N S T A N C I A</div>
          <p>${ctx.juntaIntro}</p>
          <p>
            Por medio de la presente me dirijo a usted(es) en la oportunidad de hacer constar que al apartamento identificado con las letras/números: <strong>${ctx.buildingName}-${ctx.aptNumber}</strong>, que se encuentra ubicado en ${ubicacionInmueble}; y cuyo propietario(s) es <strong>${ctx.ownerName}</strong> titular de la Cédula de Identidad <strong>${ctx.cedula}</strong>, no le es atribuible ningún gasto común ni particular de este condominio, y nada debe al condominio por ningún concepto, encontrándose en consecuencia, al día SOLVENTE en todos sus pagos hasta el mes de ${mes} del presente año.
          </p>
          <p style="margin-top: 20px;">
            SOLVENCIA DE PAGO DE CONDOMINIO que se expide a petición de la parte interesada, a los ${diaTexto} (${dia}) días del mes de ${mes} de ${anio}.
          </p>
          <div class="signature">
            <p style="margin-bottom: 40px;">Firma conforme con su contenido;</p>
            <div class="signature-line"></div>
            <strong>${ctx.signerName}</strong><br>
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
