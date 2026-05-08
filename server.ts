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

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache for financial data
const newsCache = new Map<string, { data: any, timestamp: number }>();
const finCache = new Map<string, { data: any, timestamp: number }>();
const searchCache = new Map<string, { data: any, timestamp: number }>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Status endpoint to check if keys are configured
  app.get("/api/status", (req, res) => {
    const alphaKey = process.env.VITE_ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;
    
    // Gemini key check (just to inform the UI, even if used on frontend)
    const geminiKey = process.env.GEMINI_API_KEY;
    
    const alphaValid = !!alphaKey && alphaKey.length > 5 && alphaKey !== "demo";
    const geminiValid = !!geminiKey && geminiKey.length > 5;

    res.json({
      alphaVantage: alphaValid,
      gemini: geminiValid,
      env: process.env.NODE_ENV || "development"
    });
  });

  // Proxy API for Alpha Vantage to keep key safe and bypass CORS
  app.get("/api/stocks/search", async (req, res) => {
    try {
      const { keywords } = req.query;
      const query = String(keywords).toLowerCase();
      
      const cached = searchCache.get(query);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      const apiKey = process.env.VITE_ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY || "demo";
      const response = await axios.get(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`);
      
      if (response.data && !response.data.Note && !response.data.Information) {
        searchCache.set(query, { data: response.data, timestamp: Date.now() });
      }
      
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to search stocks" });
    }
  });

  app.get("/api/stocks/financials/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const symbol = ticker.toUpperCase();

      const cached = finCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      const apiKey = process.env.VITE_ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY || "demo";
      
      // Sequential fetching instead of Promise.all to avoid burst limits
      // Alpha Vantage sometimes penalizes multiple concurrent requests on free keys
      const overview = await axios.get(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`);
      
      // Delay slightly between calls to be respectful to the free tier API
      await new Promise(resolve => setTimeout(resolve, 500));
      const income = await axios.get(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${apiKey}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      const balance = await axios.get(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${symbol}&apikey=${apiKey}`);

      const dataItems = [overview.data, income.data, balance.data];
      const rateLimitMsg = dataItems.find(d => d && (d.Note || d.Information));
      
      if (rateLimitMsg) {
        if (cached) return res.json(cached.data);
        return res.status(429).json({ 
          error: "API limit reached. Sequential buffering enabled.",
          isRateLimited: true,
          details: rateLimitMsg.Note || rateLimitMsg.Information
        });
      }

      if (!overview.data || Object.keys(overview.data).length === 0) {
        return res.status(404).json({ error: `Not found: ${symbol}` });
      }

      const combinedData = {
        overview: overview.data,
        incomeStatement: income.data,
        balanceSheet: balance.data
      };

      finCache.set(symbol, { data: combinedData, timestamp: Date.now() });
      res.json(combinedData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch financials." });
    }
  });

  // New endpoint for Stock News
  app.get("/api/stocks/news/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const symbol = ticker.toUpperCase();

      const cached = newsCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      const apiKey = process.env.VITE_ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY || "demo";
      const response = await axios.get(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${apiKey}`);
      
      const rateLimitMsg = response.data && (response.data.Note || response.data.Information);
      if (rateLimitMsg) {
        if (cached) return res.json(cached.data);
        return res.status(429).json({ error: "News API limit reached." });
      }

      newsCache.set(symbol, { data: response.data, timestamp: Date.now() });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
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
