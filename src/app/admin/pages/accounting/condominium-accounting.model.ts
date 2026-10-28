export type AccountingScopeMode = 'COMPLEX' | 'BUILDING';

export interface ChartAccount {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  group: string;
}

export interface JournalLine {
  date: string;
  entryNo: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  currency: 'USD' | 'VES';
  voucherRef: string;
}

export interface LedgerAccountSummary {
  code: string;
  name: string;
  type: ChartAccount['type'];
  debit: number;
  credit: number;
  balance: number;
}

export interface IncomeStatementLine {
  label: string;
  amount: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
}

export interface BalanceSheetLine {
  label: string;
  amount: number;
  section: 'ASSET' | 'LIABILITY' | 'EQUITY';
  isTotal?: boolean;
}

export interface AccountingDemoBundle {
  scopeLabel: string;
  periodLabel: string;
  functionalCurrency: 'USD';
  presentationNote: string;
  journal: JournalLine[];
  ledger: LedgerAccountSummary[];
  incomeStatement: IncomeStatementLine[];
  balanceSheet: BalanceSheetLine[];
  totals: {
    income: number;
    expenses: number;
    netResult: number;
    cashAndBanks: number;
    receivables: number;
    reserveFund: number;
    payables: number;
  };
  complianceChecklist: { id: string; label: string; done: boolean; legalRef: string }[];
}
