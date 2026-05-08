import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      
      // Fetch multiple endpoints for a complete picture
      const [overview, income, balance] = await Promise.all([
        axios.get(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`),
        axios.get(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`),
        axios.get(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${apiKey}`)
      ]);

      res.json({
        overview: overview.data,
        incomeStatement: income.data,
        balanceSheet: balance.data
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch financials" });
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
