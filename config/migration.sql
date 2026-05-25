-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 14/05/2026 às 03:24
-- Versão do servidor: 8.4.7
-- Versão do PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `agendamento_descarga`
--
CREATE DATABASE IF NOT EXISTS `agendamento_descarga` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `agendamento_descarga`;

-- --------------------------------------------------------

--
-- Estrutura para tabela `agendamentos`
--

DROP TABLE IF EXISTS `agendamentos`;
CREATE TABLE IF NOT EXISTS `agendamentos` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome_fornecedor` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numeros_notas` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Números de NF separados por vírgula',
  `data_agendamento` date NOT NULL,
  `canal` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `volume` int NOT NULL,
  `contato` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_veiculo` enum('carreta','bitrem','truck','outros') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'carreta',
  `origem` enum('portal','bot') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'portal',
  `recebido` tinyint(1) NOT NULL DEFAULT '0',
  `data_recebimento` datetime DEFAULT NULL,
  `usuario_id` int UNSIGNED NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_data_agendamento` (`data_agendamento`),
  KEY `idx_recebido` (`recebido`),
  KEY `idx_fornecedor` (`nome_fornecedor`),
  KEY `fk_agend_usuario` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `agendamentos`
--

INSERT INTO `agendamentos` (`id`, `nome_fornecedor`, `numeros_notas`, `data_agendamento`, `canal`, `volume`, `contato`, `tipo_veiculo`, `origem`, `recebido`, `data_recebimento`, `usuario_id`, `criado_em`, `atualizado_em`) VALUES
(1, 'chamex', '1234/1235', '2026-05-12', 'Canal 1', 100, 'agenda@chamex.com', 'carreta', 'portal', 1, '2026-05-12 22:43:00', 1, '2026-05-12 22:28:30', '2026-05-12 22:43:47'),
(2, 'condor', '124/125', '2026-05-13', 'Canal 1', 1500, 'agenda@condor.com', 'carreta', 'portal', 0, NULL, 1, '2026-05-12 22:49:45', '2026-05-12 22:49:45'),
(3, 'bic', '122/132', '2026-05-13', 'Canal 1', 24, 'agenda@bic.com', 'carreta', 'portal', 0, NULL, 1, '2026-05-13 21:55:12', '2026-05-13 21:55:12'),
(4, 'SABE', '1452', '2026-05-14', 'Canal 1', 1500, 'agenda@sabe.com', 'carreta', 'portal', 0, NULL, 1, '2026-05-13 23:19:07', '2026-05-13 23:19:07'),
(5, 'nutrimental', '45612', '2026-05-20', 'Canal 1', 2500, 'agenda@nutrimental.com', 'carreta', 'portal', 0, NULL, 1, '2026-05-13 23:39:24', '2026-05-13 23:39:24'),
(6, 'Assim', '3245', '2026-05-20', 'Canal 1', 2500, 'Agenda@flora.com', 'bitrem', 'bot', 0, NULL, 1, '2026-05-14 00:14:13', '2026-05-14 00:14:13');

-- --------------------------------------------------------

--
-- Estrutura para tabela `bot_rotas`
--

DROP TABLE IF EXISTS `bot_rotas`;
CREATE TABLE IF NOT EXISTS `bot_rotas` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Texto exibido no menu do bot',
  `descricao` text COLLATE utf8mb4_unicode_ci COMMENT 'Texto enviado ao clicar na rota',
  `ordem` int NOT NULL DEFAULT '0',
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `bot_rotas`
--

INSERT INTO `bot_rotas` (`id`, `titulo`, `descricao`, `ordem`, `ativo`, `criado_em`, `atualizado_em`) VALUES
(1, '📦 Ver agendamentos de hoje', 'Lista todos os agendamentos do dia atual.', 1, 1, '2026-05-13 22:40:00', '2026-05-13 22:40:00'),
(2, '⏳ Ver pendentes', 'Lista todos os agendamentos ainda não recebidos.', 2, 1, '2026-05-13 22:40:00', '2026-05-13 22:40:00'),
(3, '📋 Todos os agendamentos', 'Lista todos os agendamentos cadastrados.', 3, 1, '2026-05-13 22:40:00', '2026-05-13 22:40:00'),
(4, '📄 Gerar PDF hoje', 'Gera um relatório PDF dos agendamentos do dia.', 4, 1, '2026-05-13 22:40:00', '2026-05-13 22:40:00'),
(5, '📄 Gerar PDF pendentes', 'Gera um relatório PDF dos agendamentos pendentes.', 5, 1, '2026-05-13 22:40:00', '2026-05-13 22:40:00'),
(6, '🗓️ Fazer um agendamento', 'Inicia o fluxo para criar um novo agendamento.', 6, 1, '2026-05-13 22:40:00', '2026-05-13 22:40:00');

-- --------------------------------------------------------

--
-- Estrutura para tabela `bot_usuarios`
--

DROP TABLE IF EXISTS `bot_usuarios`;
CREATE TABLE IF NOT EXISTS `bot_usuarios` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `telegram_id` bigint NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `permissoes` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON array com IDs de rotas permitidas. NULL = acesso total.',
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `telegram_id` (`telegram_id`),
  KEY `idx_telegram_id` (`telegram_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `bot_usuarios`
--

INSERT INTO `bot_usuarios` (`id`, `telegram_id`, `username`, `nome`, `ativo`, `permissoes`, `criado_em`, `atualizado_em`) VALUES
(1, 1328985516, NULL, 'jonatha', 1, '[5,6]', '2026-05-13 21:46:41', '2026-05-14 00:21:58');

-- --------------------------------------------------------

--
-- Estrutura para tabela `metricas_dia`
--

DROP TABLE IF EXISTS `metricas_dia`;
CREATE TABLE IF NOT EXISTS `metricas_dia` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `max_carros_dia` int NOT NULL DEFAULT '8' COMMENT 'Máximo de veículos por dia',
  `max_volume_dia` int NOT NULL DEFAULT '0' COMMENT '0 = sem limite de volume',
  `vagoes_carreta` int NOT NULL DEFAULT '1' COMMENT 'Vagões consumidos por carreta',
  `vagoes_bitrem` int NOT NULL DEFAULT '2' COMMENT 'Vagões consumidos por bitrem',
  `vagoes_truck` int NOT NULL DEFAULT '1' COMMENT 'Vagões consumidos por truck',
  `vagoes_outros` int NOT NULL DEFAULT '1',
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `metricas_dia`
--

INSERT INTO `metricas_dia` (`id`, `max_carros_dia`, `max_volume_dia`, `vagoes_carreta`, `vagoes_bitrem`, `vagoes_truck`, `vagoes_outros`, `ativo`, `criado_em`, `atualizado_em`) VALUES
(1, 8, 100000, 1, 2, 1, 1, 1, '2026-05-13 22:39:59', '2026-05-13 22:52:32');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `perfil` enum('admin','operador') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operador',
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `perfil`, `ativo`, `criado_em`, `atualizado_em`) VALUES
(1, 'Administrador', 'admin@sistema.com', '$2a$12$hqJFWuHHTgr4bOaY7WVO4.o1C4BIxlBfoV6X7P39cOF3rAxxPKcHG', 'admin', 1, '2026-05-12 22:02:49', '2026-05-12 22:27:14'),
(2, 'usuario', 'usuario@sistema.com', '$2a$12$.GV/oqAwSKyG1ArLP0PNv.FzAFoApNAzz7zuYEjR4Hcw2IH8guxFC', 'operador', 1, '2026-05-12 22:50:43', '2026-05-12 22:50:43');

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `agendamentos`
--
ALTER TABLE `agendamentos`
  ADD CONSTRAINT `fk_agend_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
