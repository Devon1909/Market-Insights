import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Proxy API for Alpha Vantage to keep key safe and bypass CORS
  app.get("/api/stocks/search", async (req, res) => {
    try {
      const { keywords } = req.query;
      const apiKey = process.env.VITE_ALPHA_VANTAGE_API_KEY || "demo";
      const response = await axios.get(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to search stocks" });
    }
  });

  app.get("/api/stocks/financials/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const apiKey = process.env.VITE_ALPHA_VANTAGE_API_KEY || "demo";
      
      const [overview, income, balance] = await Promise.all([
        axios.get(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`),
        axios.get(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`),
        axios.get(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${apiKey}`)
      ]);

      // Check for rate limiting messages from Alpha Vantage
      const dataItems = [overview.data, income.data, balance.data];
      const rateLimitMsg = dataItems.find(d => d.Note || d.Information);
      
      if (rateLimitMsg) {
        return res.status(429).json({ 
          error: "Alpha Vantage API limit reached (5 calls/min). Please wait a moment and try again.",
          details: rateLimitMsg.Note || rateLimitMsg.Information
        });
      }

      if (!overview.data || Object.keys(overview.data).length === 0) {
        return res.status(404).json({ error: `No stock found for ticker: ${ticker}` });
      }

      res.json({
        overview: overview.data,
        incomeStatement: income.data,
        balanceSheet: balance.data
      });
    } catch (error) {
      console.error("Alpha Vantage Error:", error);
      res.status(500).json({ error: "Failed to fetch financials from provider." });
    }
  });

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  app.post("/api/analysis", async (req, res) => {
    try {
      const { ticker, financialData } = req.body;
      
      if (!financialData || !financialData.overview) {
        return res.status(400).json({ error: "Insufficient financial data for analysis." });
      }

      const model = (genAI as any).getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Analyze this stock: ${ticker}. 
            Based on the following raw financial data (Income Statement, Balance Sheet, Overview), provide:
            1. A 3-point narrative (Valuation, Risks, Growth).
            2. Five scores out of 20 for: Value, Future, Past, Health, Dividend.
            
            Data: ${JSON.stringify(financialData).substring(0, 30000)}` 
          }]
        }],
        generationConfig: {
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

      const response = await result.response;
      const responseText = response.text();
      console.log(`[AI Analysis] Successful for ${ticker}`);
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("[Gemini Analysis Error]:", error);
      res.status(500).json({ error: "AI analysis engine failed.", details: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
