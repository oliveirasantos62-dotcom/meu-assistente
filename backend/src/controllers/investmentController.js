import { randomUUID } from "crypto";
import { query } from "../db/pool.js";

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
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function mapSnapshot(row) {
  const date = normalizeSnapshotDate(row.snapshot_date);
  if (!date) return null;

  return {
    date,
    invested: Number.isFinite(Number(row.invested)) ? Number(row.invested) : 0,
    value: Number.isFinite(Number(row.value)) ? Number(row.value) : 0,
    profit: Number.isFinite(Number(row.profit)) ? Number(row.profit) : 0,
  };
}

function parseTargetAllocation(value) {
  const fallback = { Ações: 60, FIIs: 20, 'Renda Fixa': 20, Cripto: 0 };

  if (!value) return fallback;
  if (typeof value === 'object') return value;

  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSnapshotDate(value) {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  // ISO/date values: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return `${iso[1]}-${iso[2]}-${iso[3]}`;
    }
    return null;
  }

  // Compatibilidade com datas antigas no formato brasileiro.
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]);
    const year = Number(br[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return `${br[3]}-${br[2]}-${br[1]}`;
    }
  }

  return null;
}

export async function getInvestmentDashboard(req, res) {
  try {
    // Cada bloco é consultado separadamente para que uma configuração antiga
    // ou uma tabela opcional ausente não derrube toda a carteira com HTTP 500.
    let assets = [];
    let snapshots = [];
    let settings = [];

    try {
      assets = await query(
        `SELECT id,ticker,type,quantity,buy_price,current_price,created_at,updated_at
         FROM investment_assets
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [req.user.id],
      );
    } catch (error) {
      console.error("Erro ao carregar investment_assets:", error);
      return res.status(500).json({ message: "Erro ao carregar investimentos." });
    }

    try {
      snapshots = await query(
        `SELECT snapshot_date,invested,value,profit
         FROM investment_snapshots
         WHERE user_id = ?
         ORDER BY snapshot_date ASC
         LIMIT 365`,
        [req.user.id],
      );
    } catch (error) {
      console.error("Erro ao carregar investment_snapshots:", error);
      snapshots = [];
    }

    try {
      settings = await query(
        `SELECT target_allocation
         FROM investment_settings
         WHERE user_id = ?
         LIMIT 1`,
        [req.user.id],
      );
    } catch (error) {
      console.error("Erro ao carregar investment_settings:", error);
      settings = [];
    }

    return res.json({
      investments: assets.map(mapInvestment),
      portfolioHistory: snapshots.map(mapSnapshot).filter(Boolean),
      targetAllocation: parseTargetAllocation(settings[0]?.target_allocation),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao carregar investimentos." });
  }
}

export async function createInvestment(req, res) {
  try {
    const b = req.body || {};
    const ticker = String(b.ticker || "").trim().toUpperCase();
    const quantity = Number(b.quantity);
    const buyPrice = Number(b.buyPrice);
    const currentPrice = Number(b.currentPrice ?? b.buyPrice);

    if (!ticker) return res.status(400).json({ message: "Informe o ticker do ativo." });
    if (!Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: "Quantidade inválida." });
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) return res.status(400).json({ message: "Preço de compra inválido." });
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) return res.status(400).json({ message: "Preço atual inválido." });

    const id = randomUUID();
    await query(
      `INSERT INTO investment_assets (id,user_id,ticker,type,quantity,buy_price,current_price)
       VALUES (?,?,?,?,?,?,?)`,
      [id, req.user.id, ticker, normalizeType(b.type), quantity, buyPrice, currentPrice],
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
    const b = req.body || {};
    const fields = [];
    const params = [];
    if (Object.prototype.hasOwnProperty.call(b, "ticker")) { fields.push("ticker = ?"); params.push(String(b.ticker).trim().toUpperCase()); }
    if (Object.prototype.hasOwnProperty.call(b, "type")) { fields.push("type = ?"); params.push(normalizeType(b.type)); }
    if (Object.prototype.hasOwnProperty.call(b, "quantity")) { fields.push("quantity = ?"); params.push(Number(b.quantity)); }
    if (Object.prototype.hasOwnProperty.call(b, "buyPrice")) { fields.push("buy_price = ?"); params.push(Number(b.buyPrice)); }
    if (Object.prototype.hasOwnProperty.call(b, "currentPrice")) { fields.push("current_price = ?"); params.push(Number(b.currentPrice)); }
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
    const result = await query(`DELETE FROM investment_assets WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    // DELETE é idempotente: se o registro já foi removido ou o frontend tinha um
    // ID antigo, o estado local ainda pode ser sincronizado sem transformar a
    // operação em erro 404.
    if (!result.affectedRows) return res.status(204).send();
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao excluir investimento." });
  }
}

export async function saveSnapshot(req, res) {
  try {
    const b = req.body || {};
    const date = normalizeSnapshotDate(b.date);
    if (!date) {
      return res.status(400).json({ message: "Data do histórico inválida." });
    }

    const invested = Number(b.invested ?? 0);
    const value = Number(b.value ?? 0);
    const profit = Number(b.profit ?? (value - invested));

    if (![invested, value, profit].every(Number.isFinite)) {
      return res.status(400).json({ message: "Valores do histórico inválidos." });
    }

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
    const b = req.body || {};
    const [existing] = await Promise.all([
      query(`SELECT COUNT(*) AS count FROM investment_assets WHERE user_id = ?`, [req.user.id]),
    ]);
    if (Number(existing[0]?.count || 0) > 0) return res.json({ migrated: false, reason: "already_has_data" });

    const investments = Array.isArray(b.investments) ? b.investments : [];
    for (const item of investments) {
      const id = randomUUID();
      await query(
        `INSERT INTO investment_assets (id,user_id,ticker,type,quantity,buy_price,current_price,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [id, req.user.id, String(item.ticker || "").trim().toUpperCase(), normalizeType(item.type), Number(item.quantity || 0), Number(item.buyPrice || 0), Number(item.currentPrice || item.buyPrice || 0), item.createdAt || new Date(), item.updatedAt || new Date()],
      );
    }

    const history = Array.isArray(b.portfolioHistory) ? b.portfolioHistory : [];
    for (const item of history.slice(-365)) {
      const date = normalizeSnapshotDate(item.date);
      if (!date) continue;
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


function normalizeQuoteSymbol(symbol, market) {
  const clean = String(symbol || '').trim().toUpperCase();
  if (!clean) return null;
  if (market === 'US') return clean.replace(/\s+/g, '');
  if (market === 'BR') return clean.endsWith('.SA') ? clean : `${clean}.SA`;
  return clean;
}

async function fetchYahooChart(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m&includePrePost=false`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 MeuAssistente/2.0',
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`Fonte de cotação respondeu HTTP ${response.status}.`);
  const body = await response.json();
  const result = body?.chart?.result?.[0];
  if (!result) throw new Error('Ativo não encontrado na fonte de cotação.');
  const meta = result.meta || {};
  const price = Number(meta.regularMarketPrice ?? meta.postMarketPrice ?? meta.previousClose);
  if (!Number.isFinite(price) || price <= 0) throw new Error('A fonte não retornou uma cotação válida.');
  return {
    price,
    currency: String(meta.currency || '').toUpperCase() || null,
    exchange: meta.exchangeName || null,
    timestamp: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
  };
}

export async function getInvestmentQuote(req, res) {
  try {
    const market = String(req.query.market || 'BR').toUpperCase() === 'US' ? 'US' : 'BR';
    const inputSymbol = String(req.params.symbol || '').trim().toUpperCase();
    const yahooSymbol = normalizeQuoteSymbol(inputSymbol, market);
    if (!yahooSymbol) return res.status(400).json({ message: 'Ticker inválido.' });

    const quote = await fetchYahooChart(yahooSymbol);
    let price = quote.price;
    let currency = quote.currency || (market === 'US' ? 'USD' : 'BRL');
    let fxRate = 1;

    if (market === 'US' && currency === 'USD') {
      const fx = await fetchYahooChart('BRL=X');
      fxRate = fx.price;
      price *= fxRate;
      currency = 'BRL';
    }

    return res.json({
      symbol: inputSymbol,
      market,
      price,
      currency,
      nativePrice: quote.price,
      nativeCurrency: quote.currency || null,
      fxRate,
      exchange: quote.exchange,
      updatedAt: quote.timestamp,
      source: 'Yahoo Finance Chart',
    });
  } catch (error) {
    console.error('Erro ao consultar cotação:', error);
    return res.status(502).json({ message: error?.message || 'Cotação indisponível no momento.' });
  }
}
