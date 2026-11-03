import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
// Permite reutilizar o .env da raiz do projeto em desenvolvimento.
// Variáveis já definidas no ambiente ou em backend/.env têm prioridade.
dotenv.config({ path: '../.env', override: false });

const requiredDatabaseSettings = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingDatabaseSettings = requiredDatabaseSettings.filter(
  (key) => !process.env[key],
);

if (missingDatabaseSettings.length) {
  throw new Error(
    `Configuração do TiDB incompleta. Defina: ${missingDatabaseSettings.join(', ')}. ` +
    'O DB_NAME é obrigatório para evitar o erro "No database selected".',
  );
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    minVersion: 'TLSv1.2',
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}


export async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_app_data (
      user_id CHAR(36) NOT NULL PRIMARY KEY,
      app_data JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_app_data_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  // Investimentos precisam existir no primeiro deploy também.
  // Antes, essas tabelas dependiam de uma execução manual de phase7.sql,
  // causando 500 no dashboard mesmo com a API publicada.
  await query(`
    CREATE TABLE IF NOT EXISTS investment_assets (
      id CHAR(36) NOT NULL PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      ticker VARCHAR(20) NOT NULL,
      type VARCHAR(40) NOT NULL DEFAULT 'Ações',
      quantity DECIMAL(20,8) NOT NULL,
      buy_price DECIMAL(20,8) NOT NULL,
      current_price DECIMAL(20,8) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_investment_assets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_investment_assets_user (user_id),
      INDEX idx_investment_assets_ticker (user_id, ticker)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS investment_snapshots (
      id CHAR(36) NOT NULL PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      snapshot_date DATE NOT NULL,
      invested DECIMAL(20,8) NOT NULL DEFAULT 0,
      value DECIMAL(20,8) NOT NULL DEFAULT 0,
      profit DECIMAL(20,8) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_investment_snapshot_day (user_id, snapshot_date),
      INDEX idx_investment_snapshots_user_date (user_id, snapshot_date),
      CONSTRAINT fk_investment_snapshots_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS investment_settings (
      user_id CHAR(36) NOT NULL PRIMARY KEY,
      target_allocation JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_investment_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}
