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
  return {
    date: String(row.snapshot_date).slice(0, 10),
    invested: Number(row.invested),
    value: Number(row.value),
    profit: Number(row.profit),
  };
}

export async function getInvestmentDashboard(req, res) {
  try {
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
    if (!result.affectedRows) return res.status(404).json({ message: "Investimento não encontrado." });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao excluir investimento." });
  }
}

export async function saveSnapshot(req, res) {
  try {
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
