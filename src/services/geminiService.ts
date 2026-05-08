import axios from 'axios';

export interface CompanyNarrative {
  valuation: string;
  riskFactors: string;
  growthPotential: string;
  snowflake: {
    value: number;
    future: number;
    past: number;
    health: number;
    dividend: number;
  };
}

export const getCompanyAnalysis = async (ticker: string, financialData: any): Promise<CompanyNarrative> => {
  try {
    const response = await axios.post('/api/analysis', { ticker, financialData });
    return response.data;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
  }

  return {
    valuation: "Analysis currently unavailable.",
    riskFactors: "Unable to assess risks.",
    growthPotential: "Growth data pending.",
    snowflake: { value: 10, future: 10, past: 10, health: 10, dividend: 10 }
  };
};
