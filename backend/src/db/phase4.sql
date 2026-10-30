USE meu_assistente;

CREATE TABLE IF NOT EXISTS study_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  study_date DATE NOT NULL,
  discipline VARCHAR(120) NOT NULL,
  subject VARCHAR(180) NOT NULL,
  minutes INT NOT NULL DEFAULT 0,
  method VARCHAR(60) NOT NULL DEFAULT 'Exercícios',
  difficulty TINYINT NOT NULL DEFAULT 3,
  exercises INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  errors INT NOT NULL DEFAULT 0,
  learned TEXT NULL,
  not_mastered TEXT NULL,
  observations TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_study_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_study_sessions_user_date (user_id, study_date)
);

CREATE TABLE IF NOT EXISTS reading_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(160) NULL,
  type ENUM('book','article','paper','course','other') NOT NULL DEFAULT 'book',
  status ENUM('planned','reading','completed','paused') NOT NULL DEFAULT 'planned',
  progress INT NOT NULL DEFAULT 0,
  total_pages INT NULL,
  current_page INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  started_at DATE NULL,
  completed_at DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reading_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reading_user_status (user_id, status)
);

CREATE TABLE IF NOT EXISTS review_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  discipline VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  example TEXT NULL,
  tags VARCHAR(500) NULL,
  mastery TINYINT NOT NULL DEFAULT 0,
  last_review DATE NULL,
  next_review DATE NOT NULL,
  interval_days INT NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_review_user_next (user_id, next_review)
);

CREATE TABLE IF NOT EXISTS review_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  review_item_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  review_date DATE NOT NULL,
  rating ENUM('forgot','little','partial','well','master') NOT NULL,
  mastery TINYINT NOT NULL,
  next_review DATE NOT NULL,
  interval_days INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_logs_item FOREIGN KEY (review_item_id) REFERENCES review_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_review_logs_item (review_item_id, review_date)
);

CREATE TABLE IF NOT EXISTS study_errors (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  question TEXT NOT NULL,
  my_answer TEXT NULL,
  correct_answer TEXT NOT NULL,
  why_wrong TEXT NOT NULL,
  type VARCHAR(80) NOT NULL,
  discipline VARCHAR(120) NULL,
  subject VARCHAR(180) NULL,
  resolved TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  CONSTRAINT fk_study_errors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_study_errors_user_resolved (user_id, resolved)
);
