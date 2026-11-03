import { randomUUID } from "crypto";
import { query } from "../db/pool.js";

const BRAPI_BASE = "https://brapi.dev/api/quote";
const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

const normalizeMarket = (value) => {
  const allowed = ["BR", "US", "GLOBAL"];
  return allowed.includes(String(value || "").toUpperCase()) ? String(value).toUpperCase() : "BR";
};

const normalizeCurrency = (value) => {
  const currency = String(value || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "BRL";
};

async function ensureInvestmentSchema() {
  await query(`CREATE TABLE IF NOT EXISTS investment_assets (
    id VARCHAR(64) NOT NULL, user_id VARCHAR(64) NOT NULL, ticker VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'Ações', quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
    buy_price DECIMAL(20,8) NOT NULL DEFAULT 0, current_price DECIMAL(20,8) NOT NULL DEFAULT 0,
    market VARCHAR(16) NOT NULL DEFAULT 'BR', currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    buy_price_brl DECIMAL(20,8) NOT NULL DEFAULT 0, current_price_brl DECIMAL(20,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id), INDEX idx_investment_user (user_id)
  )`);
  await query(`CREATE TABLE IF NOT EXISTS investment_snapshots (
    id VARCHAR(64) NOT NULL, user_id VARCHAR(64) NOT NULL, snapshot_date DATE NOT NULL,
    invested DECIMAL(20,8) NOT NULL DEFAULT 0, value DECIMAL(20,8) NOT NULL DEFAULT 0, profit DECIMAL(20,8) NOT NULL DEFAULT 0,
    PRIMARY KEY (id), UNIQUE KEY uq_investment_snapshot (user_id, snapshot_date), INDEX idx_snapshot_user (user_id)
  )`);
  await query(`CREATE TABLE IF NOT EXISTS investment_settings (
    user_id VARCHAR(64) NOT NULL, target_allocation JSON NULL, PRIMARY KEY (user_id)
  )`);

  const columns = await query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'investment_assets'`);
  const names = new Set(columns.map((row) => row.COLUMN_NAME));
  if (!names.has('market')) await query(`ALTER TABLE investment_assets ADD COLUMN market VARCHAR(16) NOT NULL DEFAULT 'BR'`);
  if (!names.has('currency')) await query(`ALTER TABLE investment_assets ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'BRL'`);
  if (!names.has('buy_price_brl')) await query(`ALTER TABLE investment_assets ADD COLUMN buy_price_brl DECIMAL(20,8) NOT NULL DEFAULT 0`);
  if (!names.has('current_price_brl')) await query(`ALTER TABLE investment_assets ADD COLUMN current_price_brl DECIMAL(20,8) NOT NULL DEFAULT 0`);
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  if (!response.ok) throw new Error(data?.message || `Cotação indisponível (HTTP ${response.status}).`);
  return data;
}

async function fetchBrapiQuote(symbol) {
  const headers = {};
  if (process.env.BRAPI_TOKEN) headers.Authorization = `Bearer ${process.env.BRAPI_TOKEN}`;
  const data = await fetchJson(`${BRAPI_BASE}/${encodeURIComponent(symbol)}`, headers);
  const result = data?.results?.[0];
  if (!result?.regularMarketPrice) throw new Error(`Ativo ${symbol} não encontrado na B3.`);
  return { price: Number(result.regularMarketPrice), currency: "BRL", name: result.longName || result.shortName || symbol };
}

async function fetchYahooQuote(symbol) {
  const data = await fetchJson(`${YAHOO_BASE}/${encodeURIComponent(symbol)}?range=1d&interval=1d`);
  const meta = data?.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice ?? meta?.previousClose);
  if (!Number.isFinite(price) || price <= 0) throw new Error(`Ativo ${symbol} não encontrado no mercado informado.`);
  return { price, currency: normalizeCurrency(meta?.currency), name: meta?.longName || meta?.shortName || symbol };
}

async function fetchFxToBrl(currency) {
  if (currency === "BRL") return 1;
  const pair = `${currency}BRL=X`;
  try {
    const data = await fetchJson(`${YAHOO_BASE}/${encodeURIComponent(pair)}?range=1d&interval=1d`);
    const meta = data?.chart?.result?.[0]?.meta;
    const rate = Number(meta?.regularMarketPrice ?? meta?.previousClose);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

export async function getInvestmentQuote(req, res) {
  try {
    const symbol = String(req.params.symbol || "").trim().toUpperCase();
    const market = normalizeMarket(req.query.market);
    if (!symbol) return res.status(400).json({ message: "Informe o ticker." });
    const quote = market === "BR" ? await fetchBrapiQuote(symbol) : await fetchYahooQuote(symbol);
    const fxToBrl = await fetchFxToBrl(quote.currency);
    return res.json({ ticker: symbol, market, name: quote.name, price: quote.price, currency: quote.currency, fxToBrl, priceBRL: fxToBrl ? quote.price * fxToBrl : null });
  } catch (error) {
    console.error("Erro na cotação:", error);
    return res.status(502).json({ message: error.message || "Falha ao consultar a cotação." });
  }
}

const normalizeType = (value) => {
  const allowed = ["Ações", "FIIs", "Cripto", "Renda Fixa"];
  return allowed.includes(value) ? value : "Ações";
};

function mapInvestment(row) {
  return {
    id: row.id,
    ticker: row.ticker,
    type: row.type,
    quantity: Number(row.quantity),
    buyPrice: Number(row.buy_price),
    currentPrice: Number(row.current_price),
    market: row.market || "BR",
    currency: row.currency || "BRL",
    buyPriceBRL: Number(row.buy_price_brl || row.buy_price),
    currentPriceBRL: Number(row.current_price_brl || row.current_price),
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
      targetAllocation: settings[0]?.target_allocation
        ? JSON.parse(settings[0].target_allocation)
        : { "Ações": 60, "FIIs": 20, "Renda Fixa": 20, "Cripto": 0 },
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
    const currency = normalizeCurrency(b.currency);
    const buyPriceBRL = Number(b.buyPriceBRL ?? buyPrice);
    const currentPriceBRL = Number(b.currentPriceBRL ?? currentPrice);

    if (!ticker) return res.status(400).json({ message: "Informe o ticker do ativo." });
    if (!Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: "Quantidade inválida." });
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) return res.status(400).json({ message: "Preço de compra inválido." });
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) return res.status(400).json({ message: "Preço atual inválido." });

    const id = randomUUID();
    await query(
      `INSERT INTO investment_assets (id,user_id,ticker,type,quantity,buy_price,current_price,market,currency,buy_price_brl,current_price_brl)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, req.user.id, ticker, normalizeType(b.type), quantity, buyPrice, currentPrice, market, currency, buyPriceBRL, currentPriceBRL],
    );

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
    if (Object.prototype.hasOwnProperty.call(b, "quantity")) { fields.push("quantity = ?"); params.push(Number(b.quantity)); }
    if (Object.prototype.hasOwnProperty.call(b, "buyPrice")) { fields.push("buy_price = ?"); params.push(Number(b.buyPrice)); }
    if (Object.prototype.hasOwnProperty.call(b, "currentPrice")) { fields.push("current_price = ?"); params.push(Number(b.currentPrice)); }
    if (Object.prototype.hasOwnProperty.call(b, "market")) { fields.push("market = ?"); params.push(normalizeMarket(b.market)); }
    if (Object.prototype.hasOwnProperty.call(b, "currency")) { fields.push("currency = ?"); params.push(normalizeCurrency(b.currency)); }
    if (Object.prototype.hasOwnProperty.call(b, "buyPriceBRL")) { fields.push("buy_price_brl = ?"); params.push(Number(b.buyPriceBRL)); }
    if (Object.prototype.hasOwnProperty.call(b, "currentPriceBRL")) { fields.push("current_price_brl = ?"); params.push(Number(b.currentPriceBRL)); }
    if (!fields.length) return res.status(400).json({ message: "Nenhuma alteração informada." });

    params.push(req.params.id, req.user.id);
    const result = await query(`UPDATE investment_assets SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ message: "Investimento não encontrado." });

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
    if (!result.affectedRows) return res.status(404).json({ message: "Investimento não encontrado." });
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
    const date = String(b.date || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Data inválida." });
    const invested = Number(b.invested || 0);
    const value = Number(b.value || 0);
    const profit = Number(b.profit ?? value - invested);

    await query(
      `INSERT INTO investment_snapshots (id,user_id,snapshot_date,invested,value,profit)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE invested=VALUES(invested), value=VALUES(value), profit=VALUES(profit)`,
      [randomUUID(), req.user.id, date, invested, value, profit],
    );

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
    await query(
      `INSERT INTO investment_settings (user_id,target_allocation)
       VALUES (?,?)
       ON DUPLICATE KEY UPDATE target_allocation=VALUES(target_allocation)`,
      [req.user.id, JSON.stringify(allocation)],
    );
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
    const [existing] = await Promise.all([
      query(`SELECT COUNT(*) AS count FROM investment_assets WHERE user_id = ?`, [req.user.id]),
    ]);
    if (Number(existing[0]?.count || 0) > 0) return res.json({ migrated: false, reason: "already_has_data" });

    const investments = Array.isArray(b.investments) ? b.investments : [];
    for (const item of investments) {
      const id = randomUUID();
      await query(
        `INSERT INTO investment_assets (id,user_id,ticker,type,quantity,buy_price,current_price,market,currency,buy_price_brl,current_price_brl,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, req.user.id, String(item.ticker || "").trim().toUpperCase(), normalizeType(item.type), Number(item.quantity || 0), Number(item.buyPrice || 0), Number(item.currentPrice || item.buyPrice || 0), normalizeMarket(item.market), normalizeCurrency(item.currency), Number(item.buyPriceBRL || item.buyPrice || 0), Number(item.currentPriceBRL || item.currentPrice || item.buyPrice || 0), item.createdAt || new Date(), item.updatedAt || new Date()],
      );
    }

    const history = Array.isArray(b.portfolioHistory) ? b.portfolioHistory : [];
    for (const item of history.slice(-365)) {
      const date = String(item.date || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      await query(
        `INSERT INTO investment_snapshots (id,user_id,snapshot_date,invested,value,profit)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE invested=VALUES(invested), value=VALUES(value), profit=VALUES(profit)`,
        [randomUUID(), req.user.id, date, Number(item.invested || 0), Number(item.value || 0), Number(item.profit || 0)],
      );
    }

    if (b.targetAllocation && typeof b.targetAllocation === "object") {
      await query(
        `INSERT INTO investment_settings (user_id,target_allocation) VALUES (?,?)
         ON DUPLICATE KEY UPDATE target_allocation=VALUES(target_allocation)`,
        [req.user.id, JSON.stringify(b.targetAllocation)],
      );
    }

    return res.json({ migrated: true, investments: investments.length, snapshots: history.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao migrar investimentos locais." });
  }
}
