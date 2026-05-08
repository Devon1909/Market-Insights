import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || '');

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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: "user",
        parts: [{
          text: `Analyze this stock: ${ticker}. 
          Based on the following raw financial data (Income Statement, Balance Sheet, Overview), provide:
          1. A 3-point narrative (Valuation, Risks, Growth).
          2. Five scores out of 20 for: Value, Future, Past, Health, Dividend.
          
          Data: ${JSON.stringify(financialData).substring(0, 30000)}` // Safeguard token limits
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valuation: { type: Type.STRING },
            riskFactors: { type: Type.STRING },
            growthPotential: { type: Type.STRING },
            snowflake: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.NUMBER },
                future: { type: Type.NUMBER },
                past: { type: Type.NUMBER },
                health: { type: Type.NUMBER },
                dividend: { type: Type.NUMBER },
              },
              required: ["value", "future", "past", "health", "dividend"],
            },
          },
          required: ["valuation", "riskFactors", "growthPotential", "snowflake"],
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
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
