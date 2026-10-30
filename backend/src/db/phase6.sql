USE meu_assistente;

CREATE TABLE IF NOT EXISTS groups (
  id CHAR(36) NOT NULL PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  privacy ENUM('private','connections') NOT NULL DEFAULT 'connections',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_groups_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_groups_owner (owner_id)
);

CREATE TABLE IF NOT EXISTS group_members (
  id CHAR(36) NOT NULL PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner','admin','member') NOT NULL DEFAULT 'member',
  status ENUM('pending','accepted','rejected','removed') NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_group_member (group_id, user_id),
  INDEX idx_group_members_user (user_id),
  INDEX idx_group_members_group (group_id)
);

CREATE TABLE IF NOT EXISTS group_invitations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  inviter_id CHAR(36) NOT NULL,
  invitee_id CHAR(36) NOT NULL,
  status ENUM('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_group_inv_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_inv_inviter FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_inv_invitee FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_inv_invitee (invitee_id, status),
  INDEX idx_group_inv_group (group_id)
);

CREATE TABLE IF NOT EXISTS group_activities (
  id CHAR(36) NOT NULL PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  creator_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  type ENUM('habit','study','reading','goal','project','custom') NOT NULL DEFAULT 'habit',
  frequency ENUM('daily','weekly','once') NOT NULL DEFAULT 'daily',
  target_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_group_activities_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_activities_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_activities_group (group_id)
);

CREATE TABLE IF NOT EXISTS group_activity_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  activity_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  log_date DATE NOT NULL,
  note TEXT NULL,
  progress DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_group_logs_activity FOREIGN KEY (activity_id) REFERENCES group_activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_group_activity_day_user (activity_id, user_id, log_date),
  INDEX idx_group_logs_activity_date (activity_id, log_date)
);
