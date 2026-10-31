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
}
