export interface SnowflakeData {
  value: number;
  future: number;
  past: number;
  health: number;
  dividend: number;
}

export interface FinancialFlow {
  source: string;
  target: string;
  value: number;
}

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  industry: string;
  snowflake: SnowflakeData;
  sparkline: number[];
}

export interface CompanyDetails extends StockData {
  description: string;
  revenueFlow: FinancialFlow[];
  incomeStatement: {
    revenue: number;
    costOfRevenue: number;
    grossProfit: number;
    operatingExpenses: number;
    taxes: number;
    netIncome: number;
  };
}
