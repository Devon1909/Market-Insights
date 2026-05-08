import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface CompanyNarrative {
  valuation: string;
  riskFactors: string;
  growthPotential: string;
}

export const getCompanyNarrative = async (ticker: string, details: string): Promise<CompanyNarrative> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Provide a concise 3-point financial narrative for ${ticker}. 
      Details: ${details}.
      Focus on Valuation, Risk Factors, and Growth Potential.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valuation: { type: Type.STRING },
            riskFactors: { type: Type.STRING },
            growthPotential: { type: Type.STRING },
          },
          required: ["valuation", "riskFactors", "growthPotential"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
  } catch (error) {
    console.error("Gemini Error:", error);
  }

  return {
    valuation: "Analysis currently unavailable.",
    riskFactors: "Unable to assess risk factors at this time.",
    growthPotential: "Growth potential data is pending."
  };
};
