USE meu_assistente;

CREATE TABLE IF NOT EXISTS collaborative_projects (
  id CHAR(36) NOT NULL PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  status ENUM('planned','active','paused','completed') NOT NULL DEFAULT 'active',
  deadline DATE NULL,
  privacy ENUM('private','connections') NOT NULL DEFAULT 'connections',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_collab_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_collab_projects_owner (owner_id),
  INDEX idx_collab_projects_status (status)
);

CREATE TABLE IF NOT EXISTS collaborative_project_members (
  id CHAR(36) NOT NULL PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner','member') NOT NULL DEFAULT 'member',
  status ENUM('pending','accepted','declined','removed') NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_collab_members_project FOREIGN KEY (project_id) REFERENCES collaborative_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_collab_project_member (project_id, user_id),
  INDEX idx_collab_members_user (user_id),
  INDEX idx_collab_members_project (project_id)
);

CREATE TABLE IF NOT EXISTS collaborative_project_tasks (
  id CHAR(36) NOT NULL PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  creator_id CHAR(36) NOT NULL,
  responsible_id CHAR(36) NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  status ENUM('todo','doing','done') NOT NULL DEFAULT 'todo',
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  deadline DATE NULL,
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_collab_tasks_project FOREIGN KEY (project_id) REFERENCES collaborative_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_tasks_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_tasks_responsible FOREIGN KEY (responsible_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_collab_tasks_project (project_id),
  INDEX idx_collab_tasks_responsible (responsible_id),
  INDEX idx_collab_tasks_status (status)
);

CREATE TABLE IF NOT EXISTS collaborative_task_history (
  id CHAR(36) NOT NULL PRIMARY KEY,
  task_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  action VARCHAR(60) NOT NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_collab_history_task FOREIGN KEY (task_id) REFERENCES collaborative_project_tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_collab_history_task (task_id, created_at)
);

CREATE TABLE IF NOT EXISTS collaborative_project_invitations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  inviter_id CHAR(36) NOT NULL,
  invitee_id CHAR(36) NOT NULL,
  status ENUM('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_collab_inv_project FOREIGN KEY (project_id) REFERENCES collaborative_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_inv_inviter FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_inv_invitee FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_collab_inv_invitee (invitee_id, status),
  INDEX idx_collab_inv_project (project_id)
);
