export interface CashFlowReport {
  period: {
    start: string;
    end: string;
  };
  openingBalance: number;
  inflows: {
    revenue: number;
    other: number;
    total: number;
  };
  outflows: {
    expenses: number;
    payments: number;
    other: number;
    total: number;
  };
  closingBalance: number;
  transactions: Array<{
    date: string;
    type: string;
    description: string;
    amount: number;
  }>;
}

export interface ProfitLossReport {
  period: {
    start: string;
    end: string;
  };
  revenue: {
    sales: number;
    other: number;
    total: number;
  };
  expenses: {
    costOfGoodsSold: number;
    operating: number;
    other: number;
    total: number;
  };
  netIncome: number;
  grossProfit: number;
  operatingProfit: number;
}

export interface BalanceSheetReport {
  asOf: string;
  assets: {
    current: {
      cash: number;
      inventory: number;
      receivables: number;
      total: number;
    };
    fixed: {
      equipment: number;
      property: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      payables: number;
      shortTermDebt: number;
      total: number;
    };
    longTerm: {
      longTermDebt: number;
      total: number;
    };
    total: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    total: number;
  };
}

