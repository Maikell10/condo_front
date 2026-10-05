import { Injectable } from '@angular/core';
import { SAAS_INVOICE_ISSUER } from '../constants/saas-invoice.constants';

export interface SaasInvoiceDocumentPayload {
  invoice: {
    id: number;
    number: string;
    periodMonth: number;
    periodYear: number;
    feeAmount: number;
    currency: string;
    issueDate: string;
    dueDate: string;
    status: string;
  };
  client: {
    name: string;
    address: string;
    contactName: string;
    email: string;
    rif?: string;
    phone?: string;
  };
  payment: {
    amountPaid: number;
    method: string;
    reference?: string | null;
    paymentDate: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class SaasInvoicePrintService {
  /** Imprime vía iframe oculto (no requiere ventanas emergentes). */
  openPrintablePdf(data: SaasInvoiceDocumentPayload): void {
    const logoAbsolute = `${window.location.origin}${SAAS_INVOICE_ISSUER.logoUrl}`;
    const html = this.buildHtml(data, logoAbsolute);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Factura SaaS');
    iframe.style.cssText =
      'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = iframe.contentDocument ?? win?.document;
    if (!win || !doc) {
      iframe.remove();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    let printed = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 500);
    };

    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      if (fallbackTimer !== undefined) {
        clearTimeout(fallbackTimer);
      }
      try {
        win.focus();
        win.print();
      } finally {
        cleanup();
      }
    };

    const img = doc.querySelector('img.logo') as HTMLImageElement | null;
    if (img && !img.complete) {
      img.addEventListener('load', () => setTimeout(triggerPrint, 150), {
        once: true
      });
      img.addEventListener('error', () => setTimeout(triggerPrint, 150), {
        once: true
      });
      fallbackTimer = setTimeout(triggerPrint, 3000);
    } else {
      setTimeout(triggerPrint, 250);
    }
  }

  private buildHtml(data: SaasInvoiceDocumentPayload, logoUrl: string): string {
    const paid = data.invoice.status === 'PAID' && !!data.payment;
    const issuer = SAAS_INVOICE_ISSUER;
    const periodLabel = this.periodTitle(
      data.invoice.periodMonth,
      data.invoice.periodYear
    );
    const amount = this.formatMoney(
      data.invoice.feeAmount,
      data.invoice.currency
    );
    const issueDisplay = this.formatDateDisplay(data.invoice.issueDate);
    const dueDisplay = this.formatDateDisplay(data.invoice.dueDate);

    const paymentBlock = paid
      ? `
        <p class="paid-stamp">PAGADA</p>
        <p><strong>Fecha de pago:</strong> ${this.formatDateDisplay(data.payment!.paymentDate)}</p>
        <p><strong>Método:</strong> ${this.esc(data.payment!.method)}</p>
        <p><strong>Referencia:</strong> ${this.esc(data.payment!.reference || '—')}</p>
        <p class="total-line"><strong>TOTAL PAGADO:</strong> ${this.formatMoney(data.payment!.amountPaid, data.invoice.currency)}</p>
      `
      : `
        <p class="total-line"><strong>TOTAL A PAGAR:</strong> ${amount}</p>
      `;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Factura ${this.esc(data.invoice.number)} — ${this.esc(data.client.name)}</title>
  <style>
    @page { margin: 18mm 16mm; }
    body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; color: #111; font-size: 13px; line-height: 1.45; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 28px; }
    .logo { width: 120px; height: auto; }
    .issuer { text-align: right; flex: 1; }
    .issuer h1 { font-size: 18px; margin: 0 0 6px; }
    .issuer p { margin: 2px 0; font-size: 13px; }
    .section-title { font-size: 15px; font-weight: 700; margin: 22px 0 10px; text-transform: uppercase; }
    .client p { margin: 4px 0; }
    .services { margin-top: 8px; }
    .services p { margin: 6px 0; }
    .summary { margin-top: 28px; text-align: right; }
    .summary .amount { font-size: 15px; font-weight: 700; }
    .total-line { font-size: 15px; font-weight: 700; margin-top: 12px; }
    .methods { margin-top: 28px; text-align: right; }
    .methods p { margin: 4px 0; }
    .note { margin-top: 36px; text-align: center; font-size: 12px; color: #333; }
    .paid-stamp {
      display: inline-block; border: 3px solid #047857; color: #047857;
      font-weight: 800; font-size: 22px; padding: 6px 18px; letter-spacing: 2px;
      transform: rotate(-8deg); margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img class="logo" src="${logoUrl}" alt="Condominio a un Clic" />
    <div class="issuer">
      <h1>Factura N°: ${this.esc(data.invoice.number)}</h1>
      <p><strong>${this.esc(issuer.title)}</strong></p>
      <p>Identificación: ${this.esc(issuer.taxId)}</p>
      <p>Teléfono: ${this.esc(issuer.phone)}</p>
      <p>Correo: ${this.esc(issuer.email)}</p>
      <p>Fecha: ${issueDisplay}</p>
    </div>
  </div>

  <div class="section-title">Datos del cliente</div>
  <div class="client">
    <p><strong>Cliente / Condominio:</strong> ${this.esc(data.client.name)}</p>
    <p><strong>Rif:</strong> ${this.esc(data.client.rif || '—')}</p>
    <p><strong>Dirección:</strong> ${this.esc(data.client.address || '—')}</p>
    <p><strong>Teléfono cliente:</strong> ${this.esc(data.client.phone || '—')}</p>
    <p><strong>Contacto:</strong> ${this.esc(data.client.contactName)} · ${this.esc(data.client.email)}</p>
  </div>

  <div class="section-title">Descripción del servicio</div>
  <div class="services">
    <p>Serv-01 Licencia de Software "Condominio a un Clic" - AUTO ADMINISTRACIÓN</p>
    <p>Serv-02 Soporte Técnico y/o Configuración Inicial</p>
    <p><strong>Factura de ${this.esc(periodLabel)}</strong></p>
    <p>Vencimiento: ${dueDisplay}</p>
  </div>

  <div class="summary section-title">Resumen de pago</div>
  <div class="summary">
    <p class="amount">Monto en ${data.invoice.currency === 'USD' ? '$' : data.invoice.currency}: ${amount}</p>
    ${paymentBlock}
  </div>

  ${
    paid
      ? ''
      : `<div class="methods">
    <p><strong>MÉTODOS DE PAGO</strong></p>
    <p>${this.esc(issuer.bankName)}</p>
    <p>Nro. de Cuenta: ${this.esc(issuer.bankAccount)}</p>
    <p>Pago Móvil: ${this.esc(issuer.pagoMovil)}</p>
    <p>C.I: ${this.esc(issuer.pagoMovilCi)}</p>
  </div>
  <p class="note">Nota: Por favor enviar el comprobante de pago al correo electrónico asignado.</p>`
  }

</body>
</html>`;
  }

  private periodTitle(month: number, year: number): string {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ];
    const m = meses[Math.max(0, Math.min(11, month - 1))] || String(month);
    return `${m} ${year}`;
  }

  private formatMoney(amount: number, currency: string): string {
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return currency === 'USD' ? `$ ${formatted}` : `${formatted} ${currency}`;
  }

  private formatDateDisplay(value: string): string {
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return value || '—';
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  private esc(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
