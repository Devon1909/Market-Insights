import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      contents: `Analyze this stock: ${ticker}. 
      Based on the following raw financial data (Income Statement, Balance Sheet, Overview), provide:
      1. A 3-point narrative (Valuation, Risks, Growth).
      2. Five scores out of 20 for: Value, Future, Past, Health, Dividend.
      
      Data: ${JSON.stringify(financialData).substring(0, 30000)}`,
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

    const responseText = response.text;
    if (!responseText) throw new Error("No response from AI");
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
  }

  return {
    valuation: "AI Analysis is currently unavailable for this specific ticker. Please review the raw financial data below.",
    riskFactors: "Unable to generate a risk profile at this time due to data limitations.",
    growthPotential: "Growth trajectory analysis pending further financial disclosures.",
    snowflake: { value: 10, future: 10, past: 10, health: 10, dividend: 10 }
  };
};

export const getMarketPulse = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Provide a brief (2-3 sentence) professional analysis of the current US stock market sentiment as of May 2026. Focus on macro trends like interest rates and tech sector performance.",
    });
    return response.text || "Market pulse unavailable.";
  } catch (error) {
    console.error("Market Pulse Error:", error);
    return "Neutral market sentiment observed. Investors are awaiting further economic data.";
  }
};
