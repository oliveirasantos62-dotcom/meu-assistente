CREATE DATABASE IF NOT EXISTS meu_assistente
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE meu_assistente;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(40) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connections (
  id CHAR(36) NOT NULL PRIMARY KEY,
  requester_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'blocked')
    NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_connections_requester
    FOREIGN KEY (requester_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_connections_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_connections_different_users
    CHECK (requester_id <> receiver_id),

  UNIQUE KEY unique_connection_pair (requester_id, receiver_id),
  INDEX idx_connections_requester (requester_id),
  INDEX idx_connections_receiver (receiver_id)
);

CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_username ON users(username);
