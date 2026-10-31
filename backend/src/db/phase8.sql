-- Fase 8: persistência do estado completo do aplicativo no TiDB.
-- Execute com o banco do projeto selecionado no editor SQL.

CREATE TABLE IF NOT EXISTS user_app_data (
  user_id CHAR(36) NOT NULL PRIMARY KEY,
  app_data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_app_data_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
