import { randomUUID } from "crypto";
import { query } from "../db/pool.js";

const TYPES = ["Ações", "FIIs", "Cripto", "Renda Fixa"];
const MARKETS = ["BR", "US", "GLOBAL"];

const quoteCache = new Map();
let schemaPromise = null;

const normalizeType = (value) => TYPES.includes(value) ? value : "Ações";
const normalizeMarket = (value) => {
  const market = String(value || "BR").trim().toUpperCase();
  return MARKETS.includes(market) ? market : "BR";
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(value) {
  if (!value) return today();
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

function mapInvestment(row) {
  return {
    id: row.id,
    ticker: row.ticker,
    type: row.type,
    market: normalizeMarket(row.market),
    currency: row.currency || (normalizeMarket(row.market) === "US" ? "USD" : "BRL"),
    quantity: Number(row.quantity),
    buyPrice: Number(row.buy_price),
    currentPrice: Number(row.current_price),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function mapSnapshot(row) {
  return {
    date: String(row.snapshot_date).slice(0, 10),
    invested: Number(row.invested),
    value: Number(row.value),
    profit: Number(row.profit),
  };
}

async function ensureInvestmentSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`CREATE TABLE IF NOT EXISTS investment_assets (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        ticker VARCHAR(20) NOT NULL,
        type VARCHAR(40) NOT NULL DEFAULT 'Ações',
        market VARCHAR(12) NOT NULL DEFAULT 'BR',
        currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
        quantity DECIMAL(20,8) NOT NULL,
        buy_price DECIMAL(20,8) NOT NULL,
        current_price DECIMAL(20,8) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_investment_assets_user (user_id),
        INDEX idx_investment_assets_ticker (user_id, ticker)
      )`);

      // Compatibilidade com instalações antigas da fase 7.
      try { await query(`ALTER TABLE investment_assets ADD COLUMN market VARCHAR(12) NOT NULL DEFAULT 'BR'`); } catch (e) { if (!/duplicate|exists/i.test(String(e?.message || ""))) console.warn("market migration:", e.message); }
      try { await query(`ALTER TABLE investment_assets ADD COLUMN currency VARCHAR(8) NOT NULL DEFAULT 'BRL'`); } catch (e) { if (!/duplicate|exists/i.test(String(e?.message || ""))) console.warn("currency migration:", e.message); }

      await query(`CREATE TABLE IF NOT EXISTS investment_snapshots (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        snapshot_date DATE NOT NULL,
        invested DECIMAL(20,8) NOT NULL DEFAULT 0,
        value DECIMAL(20,8) NOT NULL DEFAULT 0,
        profit DECIMAL(20,8) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_investment_snapshot_day (user_id, snapshot_date),
        INDEX idx_investment_snapshots_user_date (user_id, snapshot_date)
      )`);

      await query(`CREATE TABLE IF NOT EXISTS investment_settings (
        user_id CHAR(36) NOT NULL PRIMARY KEY,
        target_allocation JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

async function fetchJson(url, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "MeuAssistente/2.0" } });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) {
      const error = new Error(`Upstream HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function quoteFromYahoo(symbol) {
  const encoded = encodeURIComponent(symbol);
  const body = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=1d&interval=1m&includePrePost=false`);
  const result = body?.chart?.result?.[0];
  const price = Number(result?.meta?.regularMarketPrice ?? result?.indicators?.quote?.[0]?.close?.filter(Number.isFinite).at(-1));
  if (!Number.isFinite(price) || price <= 0) throw new Error("Cotação Yahoo indisponível");
  return { price, currency: result?.meta?.currency || "USD", source: "Yahoo Finance" };
}

async function quoteFromBrapi(symbol) {
  const body = await fetchJson(`https://brapi.dev/api/quote/${encodeURIComponent(symbol)}`);
  const result = body?.results?.[0];
  const price = Number(result?.regularMarketPrice);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Cotação Brapi indisponível");
  return { price, currency: result?.currency || "BRL", source: "Brapi" };
}

export async function getQuote(req, res) {
  const symbol = String(req.params.symbol || "").trim().toUpperCase();
  const market = normalizeMarket(req.query.market);
  if (!symbol) return res.status(400).json({ message: "Ticker inválido." });

  const cacheKey = `${market}:${symbol}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 60_000) return res.json(cached.value);

  const providers = market === "BR"
    ? [() => quoteFromBrapi(symbol), () => quoteFromYahoo(symbol)]
    : [() => quoteFromYahoo(symbol)];

  let lastError = null;
  for (const provider of providers) {
    try {
      const quote = await provider();
      const value = { symbol, market, ...quote, fetchedAt: new Date().toISOString() };
      quoteCache.set(cacheKey, { timestamp: Date.now(), value });
      return res.json(value);
    } catch (error) {
      lastError = error;
    }
  }

  const cachedStale = quoteCache.get(cacheKey)?.value;
  if (cachedStale) return res.json({ ...cachedStale, stale: true });
  console.error("Quote providers failed", { symbol, market, error: lastError?.message });
  return res.status(502).json({ message: `Cotação indisponível no momento para ${symbol}.`, code: lastError?.status === 429 ? "RATE_LIMITED" : "QUOTE_UNAVAILABLE" });
}

export async function getInvestmentDashboard(req, res) {
  try {
    await ensureInvestmentSchema();
    const [assets, snapshots, settings] = await Promise.all([
      query(`SELECT * FROM investment_assets WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id]),
      query(`SELECT * FROM investment_snapshots WHERE user_id = ? ORDER BY snapshot_date ASC LIMIT 365`, [req.user.id]),
      query(`SELECT target_allocation FROM investment_settings WHERE user_id = ? LIMIT 1`, [req.user.id]),
    ]);
    return res.json({
      investments: assets.map(mapInvestment),
      portfolioHistory: snapshots.map(mapSnapshot),
      targetAllocation: settings[0]?.target_allocation ? JSON.parse(settings[0].target_allocation) : { "Ações": 60, "FIIs": 20, "Renda Fixa": 20, "Cripto": 0 },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao carregar investimentos." });
  }
}

export async function createInvestment(req, res) {
  try {
    await ensureInvestmentSchema();
    const b = req.body || {};
    const ticker = String(b.ticker || "").trim().toUpperCase();
    const quantity = Number(b.quantity);
    const buyPrice = Number(b.buyPrice);
    const currentPrice = Number(b.currentPrice ?? b.buyPrice);
    const market = normalizeMarket(b.market);
    const currency = String(b.currency || (market === "US" ? "USD" : "BRL")).toUpperCase();
    if (!ticker) return res.status(400).json({ message: "Informe o ticker do ativo." });
    if (!Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: "Quantidade inválida." });
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) return res.status(400).json({ message: "Preço de compra inválido." });
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) return res.status(400).json({ message: "Preço atual inválido." });
    const id = randomUUID();
    await query(`INSERT INTO investment_assets (id,user_id,ticker,type,market,currency,quantity,buy_price,current_price) VALUES (?,?,?,?,?,?,?,?,?)`, [id, req.user.id, ticker, normalizeType(b.type), market, currency, quantity, buyPrice, currentPrice]);
    const rows = await query(`SELECT * FROM investment_assets WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    return res.status(201).json({ investment: mapInvestment(rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao salvar investimento." });
  }
}

export async function updateInvestment(req, res) {
  try {
    await ensureInvestmentSchema();
    const b = req.body || {};
    const fields = [];
    const params = [];
    if (Object.prototype.hasOwnProperty.call(b, "ticker")) { fields.push("ticker = ?"); params.push(String(b.ticker).trim().toUpperCase()); }
    if (Object.prototype.hasOwnProperty.call(b, "type")) { fields.push("type = ?"); params.push(normalizeType(b.type)); }
    if (Object.prototype.hasOwnProperty.call(b, "market")) { fields.push("market = ?"); params.push(normalizeMarket(b.market)); }
    if (Object.prototype.hasOwnProperty.call(b, "currency")) { fields.push("currency = ?"); params.push(String(b.currency).toUpperCase()); }
    if (Object.prototype.hasOwnProperty.call(b, "quantity")) { fields.push("quantity = ?"); params.push(Number(b.quantity)); }
    if (Object.prototype.hasOwnProperty.call(b, "buyPrice")) { fields.push("buy_price = ?"); params.push(Number(b.buyPrice)); }
    if (Object.prototype.hasOwnProperty.call(b, "currentPrice")) { fields.push("current_price = ?"); params.push(Number(b.currentPrice)); }
    if (!fields.length) return res.status(400).json({ message: "Nenhuma alteração informada." });
    params.push(req.params.id, req.user.id);
    const result = await query(`UPDATE investment_assets SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ message: "Investimento não encontrado. Atualize a carteira para sincronizar os IDs." });
    const rows = await query(`SELECT * FROM investment_assets WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    return res.json({ investment: mapInvestment(rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar investimento." });
  }
}

export async function deleteInvestment(req, res) {
  try {
    await ensureInvestmentSchema();
    const result = await query(`DELETE FROM investment_assets WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Investimento não encontrado. A carteira pode estar usando um ID antigo." });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao excluir investimento." });
  }
}

export async function saveSnapshot(req, res) {
  try {
    await ensureInvestmentSchema();
    const b = req.body || {};
    const date = normalizeDate(b.date ?? b.snapshotDate ?? b.snapshot_date);
    if (!date) return res.status(400).json({ message: "Data inválida. Use YYYY-MM-DD." });
    const invested = Number(b.invested ?? 0);
    const value = Number(b.value ?? 0);
    const profit = Number(b.profit ?? (value - invested));
    if (![invested, value, profit].every(Number.isFinite) || invested < 0 || value < 0) return res.status(400).json({ message: "Dados do histórico inválidos." });
    await query(`INSERT INTO investment_snapshots (id,user_id,snapshot_date,invested,value,profit) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE invested=VALUES(invested), value=VALUES(value), profit=VALUES(profit)`, [randomUUID(), req.user.id, date, invested, value, profit]);
    const rows = await query(`SELECT * FROM investment_snapshots WHERE user_id = ? ORDER BY snapshot_date ASC LIMIT 365`, [req.user.id]);
    return res.json({ portfolioHistory: rows.map(mapSnapshot) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao salvar histórico da carteira." });
  }
}

export async function saveSettings(req, res) {
  try {
    await ensureInvestmentSchema();
    const allocation = req.body?.targetAllocation;
    if (!allocation || typeof allocation !== "object") return res.status(400).json({ message: "Alocação inválida." });
    await query(`INSERT INTO investment_settings (user_id,target_allocation) VALUES (?,?) ON DUPLICATE KEY UPDATE target_allocation=VALUES(target_allocation)`, [req.user.id, JSON.stringify(allocation)]);
    return res.json({ targetAllocation: allocation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao salvar configuração dos investimentos." });
  }
}

export async function migrateLocalInvestments(req, res) {
  try {
    await ensureInvestmentSchema();
    const b = req.body || {};
    const existing = await query(`SELECT COUNT(*) AS count FROM investment_assets WHERE user_id = ?`, [req.user.id]);
    if (Number(existing[0]?.count || 0) > 0) return res.json({ migrated: false, reason: "already_has_data" });
    const investments = Array.isArray(b.investments) ? b.investments : [];
    for (const item of investments) {
      const market = normalizeMarket(item.market);
      await query(`INSERT INTO investment_assets (id,user_id,ticker,type,market,currency,quantity,buy_price,current_price,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [randomUUID(), req.user.id, String(item.ticker || "").trim().toUpperCase(), normalizeType(item.type), market, String(item.currency || (market === "US" ? "USD" : "BRL")).toUpperCase(), Number(item.quantity || 0), Number(item.buyPrice || 0), Number(item.currentPrice || item.buyPrice || 0), item.createdAt || new Date(), item.updatedAt || new Date()]);
    }
    const history = Array.isArray(b.portfolioHistory) ? b.portfolioHistory : [];
    for (const item of history.slice(-365)) {
      const date = normalizeDate(item.date);
      if (!date) continue;
      await query(`INSERT INTO investment_snapshots (id,user_id,snapshot_date,invested,value,profit) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE invested=VALUES(invested), value=VALUES(value), profit=VALUES(profit)`, [randomUUID(), req.user.id, date, Number(item.invested || 0), Number(item.value || 0), Number(item.profit || 0)]);
    }
    if (b.targetAllocation && typeof b.targetAllocation === "object") await query(`INSERT INTO investment_settings (user_id,target_allocation) VALUES (?,?) ON DUPLICATE KEY UPDATE target_allocation=VALUES(target_allocation)`, [req.user.id, JSON.stringify(b.targetAllocation)]);
    return res.json({ migrated: true, investments: investments.length, snapshots: history.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao migrar investimentos locais." });
  }
}
