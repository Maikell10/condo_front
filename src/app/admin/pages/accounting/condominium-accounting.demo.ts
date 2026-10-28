import {
  AccountingDemoBundle,
  BalanceSheetLine,
  ChartAccount,
  IncomeStatementLine,
  JournalLine,
  LedgerAccountSummary
} from './condominium-accounting.model';

/** Plan de cuentas simplificado — gasto común / flujo (LPH art. 7 y 20). */
export const CONDO_CHART: ChartAccount[] = [
  { code: '1101', name: 'Banco cuenta operativa (USD)', type: 'ASSET', group: 'Disponibilidades' },
  { code: '1102', name: 'Banco cuenta operativa (Bs.)', type: 'ASSET', group: 'Disponibilidades' },
  { code: '1201', name: 'Cuentas por cobrar — cuotas condominio', type: 'ASSET', group: 'Exigible' },
  { code: '1301', name: 'Fondo de reserva (patrimonio restringido)', type: 'ASSET', group: 'Reserva' },
  { code: '2101', name: 'Cuentas por pagar — proveedores', type: 'LIABILITY', group: 'Obligaciones' },
  { code: '2201', name: 'Retenciones y aportes laborales', type: 'LIABILITY', group: 'Obligaciones' },
  { code: '3101', name: 'Patrimonio del condominio', type: 'EQUITY', group: 'Patrimonio' },
  { code: '4101', name: 'Ingresos por cuotas de condominio', type: 'INCOME', group: 'Ingresos ordinarios' },
  { code: '4102', name: 'Ingresos por multas e intereses de mora', type: 'INCOME', group: 'Ingresos ordinarios' },
  { code: '5101', name: 'Servicios públicos (electricidad, agua)', type: 'EXPENSE', group: 'Gasto común' },
  { code: '5102', name: 'Vigilancia y conserjería', type: 'EXPENSE', group: 'Gasto común' },
  { code: '5103', name: 'Mantenimiento y reparaciones', type: 'EXPENSE', group: 'Gasto común' },
  { code: '5104', name: 'Honorarios administración', type: 'EXPENSE', group: 'Gasto común' },
  { code: '5105', name: 'Aportes al fondo de reserva', type: 'EXPENSE', group: 'Reserva' }
];

function seedFromKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

function money(base: number, variance: number, seed: number): number {
  const f = 0.85 + (seed % 30) / 100;
  return Math.round(base * f * variance * 100) / 100;
}

export function buildCondominiumAccountingDemo(
  scopeKey: string,
  scopeLabel: string,
  month: number,
  year: number,
  unitCount: number
): AccountingDemoBundle {
  const seed = seedFromKey(`${scopeKey}-${month}-${year}`);
  const periodLabel = `${String(month).padStart(2, '0')}/${year}`;
  const units = Math.max(unitCount, 8);

  const cuotasRecaudadas = money(units * 185, 1, seed);
  const multas = money(420, 1, seed + 3);
  const totalIncome = cuotasRecaudadas + multas;

  const servicios = money(units * 42, 1, seed + 7);
  const vigilancia = money(units * 28, 1, seed + 11);
  const mantenimiento = money(2800, 1, seed + 13);
  const honorarios = money(1500, 1, seed + 17);
  const aporteReserva = money(totalIncome * 0.1, 1, seed + 19);
  const totalExpenses = servicios + vigilancia + mantenimiento + honorarios + aporteReserva;
  const netResult = totalIncome - totalExpenses;

  const cxp = money(3200, 1, seed + 23);
  const retenciones = money(890, 1, seed + 29);
  const cxc = money(units * 22, 1, seed + 31);
  const bancoUsd = money(totalIncome * 0.72, 1, seed + 37);
  const bancoBs = money(45000, 1, seed + 41);
  const reserveAccum = money(aporteReserva * 14, 1, seed + 43);
  const patrimonio = bancoUsd + bancoBs + cxc + reserveAccum - cxp - retenciones;

  const journal: JournalLine[] = [
    entry('001', 1, '4101', 'Ingresos por cuotas de condominio', 'Recaudación cuotas del mes', 0, cuotasRecaudadas, 'USD', 'RC-' + periodLabel),
    entry('001', 1, '1101', 'Banco cuenta operativa (USD)', 'Recaudación cuotas del mes', cuotasRecaudadas * 0.68, 0, 'USD', 'RC-' + periodLabel),
    entry('001', 1, '1102', 'Banco cuenta operativa (Bs.)', 'Recaudación cuotas del mes', cuotasRecaudadas * 0.32, 0, 'VES', 'RC-' + periodLabel),
    entry('002', 5, '1101', 'Banco cuenta operativa (USD)', 'Multas e intereses mora', multas, 0, 'USD', 'ML-014'),
    entry('002', 5, '4102', 'Ingresos por multas e intereses de mora', 'Multas e intereses mora', 0, multas, 'USD', 'ML-014'),
    entry('003', 8, '5101', 'Servicios públicos (electricidad, agua)', 'Factura CORPOELEC / Hidrolara', servicios, 0, 'USD', 'FAC-8831'),
    entry('003', 8, '2101', 'Cuentas por pagar — proveedores', 'Factura CORPOELEC / Hidrolara', 0, servicios, 'USD', 'FAC-8831'),
    entry('004', 12, '5102', 'Vigilancia y conserjería', 'Nómina vigilancia quincenal', vigilancia, 0, 'USD', 'NOM-VIG'),
    entry('004', 12, '1101', 'Banco cuenta operativa (USD)', 'Nómina vigilancia quincenal', 0, vigilancia, 'USD', 'NOM-VIG'),
    entry('005', 15, '5103', 'Mantenimiento y reparaciones', 'Reparación bomba de agua', mantenimiento, 0, 'USD', 'OT-221'),
    entry('005', 15, '1101', 'Banco cuenta operativa (USD)', 'Reparación bomba de agua', 0, mantenimiento, 'USD', 'OT-221'),
    entry('006', 18, '5104', 'Honorarios administración', 'Honorarios administrador edificio', honorarios, 0, 'USD', 'HON-03'),
    entry('006', 18, '2101', 'Cuentas por pagar — proveedores', 'Honorarios administrador edificio', 0, honorarios, 'USD', 'HON-03'),
    entry('007', 22, '5105', 'Aportes al fondo de reserva', '10% recaudación a fondo de reserva', aporteReserva, 0, 'USD', 'FR-' + periodLabel),
    entry('007', 22, '1301', 'Fondo de reserva (patrimonio restringido)', '10% recaudación a fondo de reserva', 0, aporteReserva, 'USD', 'FR-' + periodLabel),
    entry('008', 25, '1201', 'Cuentas por cobrar — cuotas condominio', 'Cuotas pendientes de cobro', cxc, 0, 'USD', 'CXC'),
    entry('008', 25, '4101', 'Ingresos por cuotas de condominio', 'Devengo cuotas no cobradas', 0, cxc, 'USD', 'CXC')
  ].map((j) => ({ ...j, date: `${year}-${String(month).padStart(2, '0')}-${String(j.day).padStart(2, '0')}` }));

  const ledger = buildLedger(journal);
  const incomeStatement: IncomeStatementLine[] = [
    { label: 'Ingresos por cuotas de condominio', amount: cuotasRecaudadas + cxc },
    { label: 'Multas e intereses de mora', amount: multas },
    { label: 'Total ingresos', amount: totalIncome + cxc, isSubtotal: true },
    { label: 'Servicios públicos', amount: servicios },
    { label: 'Vigilancia y conserjería', amount: vigilancia },
    { label: 'Mantenimiento y reparaciones', amount: mantenimiento },
    { label: 'Honorarios administración', amount: honorarios },
    { label: 'Aporte fondo de reserva', amount: aporteReserva },
    { label: 'Total gastos', amount: totalExpenses, isSubtotal: true },
    { label: 'Resultado del periodo (superávit)', amount: netResult, isTotal: true }
  ];

  const balanceSheet: BalanceSheetLine[] = [
    { label: 'Banco USD', amount: bancoUsd, section: 'ASSET' },
    { label: 'Banco Bs. (equivalente USD)', amount: bancoBs / 38.5, section: 'ASSET' },
    { label: 'Cuentas por cobrar propietarios', amount: cxc, section: 'ASSET' },
    { label: 'Fondo de reserva', amount: reserveAccum, section: 'ASSET' },
    { label: 'Total activo', amount: bancoUsd + bancoBs / 38.5 + cxc + reserveAccum, section: 'ASSET', isTotal: true },
    { label: 'Cuentas por pagar', amount: cxp, section: 'LIABILITY' },
    { label: 'Retenciones laborales', amount: retenciones, section: 'LIABILITY' },
    { label: 'Total pasivo', amount: cxp + retenciones, section: 'LIABILITY', isTotal: true },
    { label: 'Patrimonio / fondos copropietarios', amount: patrimonio, section: 'EQUITY' },
    { label: 'Total patrimonio', amount: patrimonio, section: 'EQUITY', isTotal: true }
  ];

  return {
    scopeLabel,
    periodLabel,
    functionalCurrency: 'USD',
    presentationNote:
      'Unidad de cuenta en USD (criterio aprobado en asamblea). Conversión Bs. a tasa de referencia del periodo. No constituye dictamen fiscal.',
    journal,
    ledger,
    incomeStatement,
    balanceSheet,
    totals: {
      income: totalIncome + cxc,
      expenses: totalExpenses,
      netResult,
      cashAndBanks: bancoUsd + bancoBs / 38.5,
      receivables: cxc,
      reserveFund: reserveAccum,
      payables: cxp + retenciones
    },
    complianceChecklist: [
      {
        id: 'diario',
        label: 'Libro Diario actualizado con partida doble',
        done: true,
        legalRef: 'LPH art. 20 literal g'
      },
      {
        id: 'comprobantes',
        label: 'Comprobantes respaldados y disponibles para copropropietarios',
        done: true,
        legalRef: 'LPH art. 20 literal f'
      },
      {
        id: 'sellado',
        label: 'Libros sellados (notario o juez de distrito)',
        done: false,
        legalRef: 'LPH art. 20 literal g'
      },
      {
        id: 'informe',
        label: 'Informe y cuenta anual de gestión preparado',
        done: month === 12,
        legalRef: 'LPH art. 20'
      },
      {
        id: 'nif',
        label: 'Estados financieros bajo criterios VEN-NIF PYME (buena práctica)',
        done: true,
        legalRef: 'Recomendación técnica'
      }
    ]
  };
}

function entry(
  entryNo: string,
  day: number,
  accountCode: string,
  accountName: string,
  description: string,
  debit: number,
  credit: number,
  currency: 'USD' | 'VES',
  voucherRef: string
): JournalLine & { day: number } {
  return {
    entryNo,
    day,
    accountCode,
    accountName,
    description,
    debit: round2(debit),
    credit: round2(credit),
    currency,
    voucherRef,
    date: ''
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildLedger(journal: JournalLine[]): LedgerAccountSummary[] {
  const map = new Map<string, LedgerAccountSummary>();
  for (const line of journal) {
    const acc = CONDO_CHART.find((c) => c.code === line.accountCode);
    const type = acc?.type ?? 'EXPENSE';
    const cur = map.get(line.accountCode) ?? {
      code: line.accountCode,
      name: line.accountName,
      type,
      debit: 0,
      credit: 0,
      balance: 0
    };
    cur.debit += line.debit;
    cur.credit += line.credit;
    map.set(line.accountCode, cur);
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      balance: balanceForType(row.type, row.debit, row.credit)
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

function balanceForType(type: ChartAccount['type'], debit: number, credit: number): number {
  if (type === 'ASSET' || type === 'EXPENSE') return round2(debit - credit);
  return round2(credit - debit);
}
