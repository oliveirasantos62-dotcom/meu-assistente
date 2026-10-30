USE meu_assistente;

CREATE TABLE IF NOT EXISTS shared_activities (
  id CHAR(36) NOT NULL PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NULL,
  type ENUM('habit','goal','study','reading','project','custom') NOT NULL DEFAULT 'custom',
  privacy ENUM('private','connections','group') NOT NULL DEFAULT 'connections',
  frequency ENUM('daily','weekly','custom','once') NOT NULL DEFAULT 'daily',
  target_date DATE NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shared_activities_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_shared_activities_owner (owner_id),
  INDEX idx_shared_activities_type (type)
);

CREATE TABLE IF NOT EXISTS shared_activity_members (
  id CHAR(36) NOT NULL PRIMARY KEY,
  activity_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner','member') NOT NULL DEFAULT 'member',
  status ENUM('pending','accepted','declined','removed') NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shared_members_activity FOREIGN KEY (activity_id) REFERENCES shared_activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_shared_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_activity_member (activity_id, user_id),
  INDEX idx_shared_members_user (user_id),
  INDEX idx_shared_members_activity (activity_id)
);

CREATE TABLE IF NOT EXISTS shared_activity_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  activity_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  log_date DATE NOT NULL,
  note TEXT NULL,
  progress INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shared_logs_activity FOREIGN KEY (activity_id) REFERENCES shared_activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_shared_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_activity_user_day (activity_id, user_id, log_date),
  INDEX idx_shared_logs_activity_date (activity_id, log_date),
  INDEX idx_shared_logs_user_date (user_id, log_date)
);

CREATE TABLE IF NOT EXISTS foguinho_invitations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  activity_id CHAR(36) NOT NULL,
  inviter_id CHAR(36) NOT NULL,
  invitee_id CHAR(36) NOT NULL,
  status ENUM('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_foguinho_inv_activity FOREIGN KEY (activity_id) REFERENCES shared_activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_foguinho_inv_inviter FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_foguinho_inv_invitee FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_foguinho_inv_invitee (invitee_id, status),
  INDEX idx_foguinho_inv_activity (activity_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(500) NOT NULL,
  data_json JSON NULL,
  read_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, read_at, created_at)
);
