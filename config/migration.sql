-- ===========================================
-- Script de criação do banco de dados
-- Sistema de Agendamento de Descarga
-- ===========================================

CREATE DATABASE IF NOT EXISTS agendamento_descarga
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agendamento_descarga;

-- -------------------------------------------
-- Tabela de usuários administrativos
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(100)    NOT NULL,
  email       VARCHAR(150)    NOT NULL UNIQUE,
  senha       VARCHAR(255)    NOT NULL,
  perfil      ENUM('admin','operador') NOT NULL DEFAULT 'operador',
  ativo       TINYINT(1)      NOT NULL DEFAULT 1,
  criado_em   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- Tabela de agendamentos de descarga
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS agendamentos (
  id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nome_fornecedor     VARCHAR(150)    NOT NULL,
  numeros_notas       TEXT            NOT NULL COMMENT 'Números de NF separados por vírgula',
  data_agendamento    DATE            NOT NULL,
  canal               VARCHAR(100)    NOT NULL,
  recebido            TINYINT(1)      NOT NULL DEFAULT 0,
  data_recebimento    DATETIME        NULL,
  usuario_id          INT UNSIGNED    NOT NULL,
  criado_em           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_data_agendamento (data_agendamento),
  INDEX idx_recebido (recebido),
  INDEX idx_fornecedor (nome_fornecedor),
  CONSTRAINT fk_agend_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- Tabela de usuários do Bot do Telegram
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS bot_usuarios (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  telegram_id   BIGINT          NOT NULL UNIQUE,
  username      VARCHAR(100)    NULL,
  nome          VARCHAR(150)    NOT NULL,
  ativo         TINYINT(1)      NOT NULL DEFAULT 1,
  criado_em     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_telegram_id (telegram_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- NOTA: O usuário admin é criado pelo script:
--   node scripts/seed.js
-- Isso garante que o hash bcrypt seja gerado
-- corretamente no seu ambiente.
-- -------------------------------------------
