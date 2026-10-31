import { query } from '../db/pool.js';

export async function getAppData(req, res) {
  try {
    const rows = await query(
      `SELECT app_data, updated_at
       FROM user_app_data
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.id],
    );

    if (!rows[0]) {
      return res.json({ exists: false, appData: null, updatedAt: null });
    }

    const value = rows[0].app_data;
    const appData = typeof value === 'string' ? JSON.parse(value) : value;

    return res.json({
      exists: true,
      appData,
      updatedAt: rows[0].updated_at,
    });
  } catch (error) {
    console.error('Erro ao carregar dados do aplicativo:', error);
    return res.status(500).json({ message: 'Erro ao carregar seus dados.' });
  }
}

export async function putAppData(req, res) {
  try {
    const { appData } = req.body || {};

    if (!appData || typeof appData !== 'object' || Array.isArray(appData)) {
      return res.status(400).json({ message: 'Envie os dados do aplicativo em formato válido.' });
    }

    const serialized = JSON.stringify(appData);
    if (Buffer.byteLength(serialized, 'utf8') > 5 * 1024 * 1024) {
      return res.status(413).json({ message: 'Os dados enviados excedem o limite de 5 MB.' });
    }

    await query(
      `INSERT INTO user_app_data (user_id, app_data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         app_data = VALUES(app_data),
         updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, serialized],
    );

    const rows = await query(
      'SELECT updated_at FROM user_app_data WHERE user_id = ? LIMIT 1',
      [req.user.id],
    );

    return res.json({ ok: true, updatedAt: rows[0]?.updated_at || null });
  } catch (error) {
    console.error('Erro ao salvar dados do aplicativo:', error);
    return res.status(500).json({ message: 'Erro ao salvar seus dados.' });
  }
}
