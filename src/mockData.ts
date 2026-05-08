import { StockData, CompanyDetails } from './types.ts';

export const MOCK_STOCKS: StockData[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    price: 182.52,
    change: 1.25,
    changePercent: 0.69,
    marketCap: '2.85T',
    industry: 'Consumer Electronics',
    snowflake: { value: 12, future: 15, past: 18, health: 14, dividend: 6 },
    sparkline: [178, 179, 181, 180, 182, 181, 182.52],
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    price: 415.50,
    change: -2.30,
    changePercent: -0.55,
    marketCap: '3.08T',
    industry: 'Software',
    snowflake: { value: 10, future: 18, past: 19, health: 17, dividend: 8 },
    sparkline: [410, 412, 418, 416, 417, 415.5],
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 875.28,
    change: 45.12,
    changePercent: 5.43,
    marketCap: '2.21T',
    industry: 'Semiconductors',
    snowflake: { value: 5, future: 20, past: 19, health: 18, dividend: 2 },
    sparkline: [780, 800, 820, 850, 860, 875.28],
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    price: 175.34,
    change: -5.12,
    changePercent: -2.84,
    marketCap: '558B',
    industry: 'Automobiles',
    snowflake: { value: 8, future: 17, past: 14, health: 15, dividend: 0 },
    sparkline: [190, 185, 182, 180, 178, 175.34],
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 152.12,
    change: 2.45,
    changePercent: 1.63,
    marketCap: '1.91T',
    industry: 'Internet Content & Information',
    snowflake: { value: 15, future: 14, past: 16, health: 18, dividend: 4 },
    sparkline: [145, 148, 150, 149, 151, 152.12],
  }
];

export const getMockCompanyDetails = (ticker: string): CompanyDetails | undefined => {
  const base = MOCK_STOCKS.find(s => s.ticker === ticker);
  if (!base) return undefined;

  return {
    ...base,
    description: ticker === 'AAPL' 
      ? "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
      : "A leading technology company focused on innovation in its respective sector.",
    incomeStatement: {
      revenue: 383285,
      costOfRevenue: 214137,
      grossProfit: 169148,
      operatingExpenses: 54847,
      taxes: 16741,
      netIncome: 96995,
    },
    revenueFlow: [
      { source: "Total Revenue", target: "Cost of Revenue", value: 214137 },
      { source: "Total Revenue", target: "Gross Profit", value: 169148 },
      { source: "Gross Profit", target: "Operating Expenses", value: 54847 },
      { source: "Gross Profit", target: "Operating Income", value: 114301 },
      { source: "Operating Income", target: "Taxes", value: 16741 },
      { source: "Operating Income", target: "Net Income", value: 96995 },
    ]
  };
};
