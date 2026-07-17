/*
 Navicat Premium Dump SQL

 Source Server         : 本地
 Source Server Type    : MySQL
 Source Server Version : 80045 (8.0.45)
 Source Host           : localhost:3306
 Source Schema         : emo_ai

 Target Server Type    : MySQL
 Target Server Version : 80045 (8.0.45)
 File Encoding         : 65001

 Date: 01/07/2026 18:14:08
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for app_versions
-- ----------------------------
DROP TABLE IF EXISTS `app_versions`;
CREATE TABLE `app_versions`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '应用版本ID',
  `platform` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '平台 ios android web',
  `version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '版本号',
  `build_no` int NOT NULL COMMENT '构建号',
  `force_update` tinyint(1) NULL DEFAULT 0 COMMENT '是否强制更新',
  `download_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '下载地址',
  `changelog` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '更新说明',
  `min_supported_version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '最低支持版本',
  `published_at` datetime(3) NULL DEFAULT NULL COMMENT '发布时间',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_app_versions_platform`(`platform` ASC) USING BTREE,
  INDEX `idx_app_versions_build_no`(`build_no` ASC) USING BTREE,
  INDEX `idx_app_versions_published_at`(`published_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '应用版本表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of app_versions
-- ----------------------------

-- ----------------------------
-- Table structure for auth_refresh_tokens
-- ----------------------------
DROP TABLE IF EXISTS `auth_refresh_tokens`;
CREATE TABLE `auth_refresh_tokens`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '刷新令牌记录ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `token_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '刷新令牌唯一ID',
  `token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '刷新令牌哈希值',
  `device_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '设备ID',
  `device_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '设备名称',
  `ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '登录IP',
  `user_agent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '客户端User-Agent',
  `expires_at` datetime(3) NOT NULL COMMENT '过期时间',
  `revoked_at` datetime(3) NULL DEFAULT NULL COMMENT '撤销时间',
  `revoke_reason` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '撤销原因',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime(3) NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_auth_refresh_tokens_token_id`(`token_id` ASC) USING BTREE,
  UNIQUE INDEX `idx_auth_refresh_tokens_token_hash`(`token_hash` ASC) USING BTREE,
  INDEX `idx_auth_refresh_tokens_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_auth_refresh_tokens_expires_at`(`expires_at` ASC) USING BTREE,
  INDEX `idx_auth_refresh_tokens_revoked_at`(`revoked_at` ASC) USING BTREE,
  INDEX `idx_auth_refresh_tokens_deleted_at`(`deleted_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '刷新令牌表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of auth_refresh_tokens
-- ----------------------------
INSERT INTO `auth_refresh_tokens` VALUES (1, 1, '9af36edc-f0b5-4658-9aef-0cd2678ef9ce', 'a08db7406c7e257205321ce0ad22df0cbc3e8f7082654b97d05f3d8b209f6bdf', '', '', '127.0.0.1:56259', 'Apifox/1.0.0 (https://apifox.com)', '2026-07-31 11:41:16.323', NULL, '', '2026-07-01 11:41:16.324', '2026-07-01 11:41:16.324', NULL);
INSERT INTO `auth_refresh_tokens` VALUES (2, 1, 'f3110944-9ca7-4b62-a3c7-b949f9d2ec1a', '2b6db7bdbc4c19185fb3a4f10635ffcb88cc5ece2b19fde6b857f490c5e1017e', '', '', '127.0.0.1:55628', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-07-31 13:49:33.223', NULL, '', '2026-07-01 13:49:33.223', '2026-07-01 13:49:33.223', NULL);
INSERT INTO `auth_refresh_tokens` VALUES (3, 1, 'c8d8453c-9eb4-49f5-9048-6a960c309800', 'a531e0edad7cbd4efa8f5b8421bb8ead8ec5fd56800f4d857eac2fddb270a7e2', '', '', '127.0.0.1:57280', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-07-31 14:07:16.045', NULL, '', '2026-07-01 14:07:16.045', '2026-07-01 14:07:16.045', NULL);
INSERT INTO `auth_refresh_tokens` VALUES (4, 1, '101573f9-cbfb-49b7-a868-1fc5619f4a3d', '2206254401cdd5dc2eb940be7a9ef0fcdae4f073dc8091a9cf556ad366e2cf78', '', '', '127.0.0.1:64263', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-07-31 14:50:14.234', NULL, '', '2026-07-01 14:50:14.234', '2026-07-01 14:50:14.234', NULL);
INSERT INTO `auth_refresh_tokens` VALUES (5, 1, 'fcc381b1-6634-4d9d-bf38-420647f85620', 'd5d802056bd90c1b2dea0a2ac11f697de300c656f4cf2652be4f579b478854e4', '', '', '127.0.0.1:57927', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-07-31 16:47:15.328', NULL, '', '2026-07-01 16:47:15.331', '2026-07-01 16:47:15.331', NULL);
INSERT INTO `auth_refresh_tokens` VALUES (6, 1, 'b0918cc3-632a-4d5e-81c8-3c1595d822dc', 'f75075c2cc02e872f1aaac811def3fe901032c9a1aa88dea824fae6a03904235', '', '', '127.0.0.1:51297', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-07-31 17:37:10.832', NULL, '', '2026-07-01 17:37:10.834', '2026-07-01 17:37:10.834', NULL);
INSERT INTO `auth_refresh_tokens` VALUES (7, 2, '1964c806-33c3-4e59-9b12-822a0ca89243', 'd10b70ac5697e27ab64f47dfc62a35ece44637684d355124d9af5578382274d1', '', '', '127.0.0.1:59196', 'Apifox/1.0.0 (https://apifox.com)', '2026-07-31 18:13:00.642', NULL, '', '2026-07-01 18:13:00.643', '2026-07-01 18:13:00.643', NULL);

-- ----------------------------
-- Table structure for chat_context_summaries
-- ----------------------------
DROP TABLE IF EXISTS `chat_context_summaries`;
CREATE TABLE `chat_context_summaries`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '会话摘要ID',
  `session_id` bigint NOT NULL COMMENT '聊天会话ID',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '摘要内容',
  `message_start_id` bigint NULL DEFAULT 0 COMMENT '摘要起始消息ID',
  `message_end_id` bigint NULL DEFAULT 0 COMMENT '摘要结束消息ID',
  `model` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '摘要模型名称',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_chat_context_summaries_session_id`(`session_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '聊天上下文摘要表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of chat_context_summaries
-- ----------------------------

-- ----------------------------
-- Table structure for chat_feedback
-- ----------------------------
DROP TABLE IF EXISTS `chat_feedback`;
CREATE TABLE `chat_feedback`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '消息反馈ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `session_id` bigint NOT NULL COMMENT '聊天会话ID',
  `message_id` bigint NOT NULL COMMENT '被反馈的消息ID',
  `rating` int NULL DEFAULT 0 COMMENT '评分',
  `feedback_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '反馈类型',
  `content` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '反馈内容',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_chat_feedback_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_chat_feedback_session_id`(`session_id` ASC) USING BTREE,
  INDEX `idx_chat_feedback_message_id`(`message_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '聊天反馈表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of chat_feedback
-- ----------------------------

-- ----------------------------
-- Table structure for chat_messages
-- ----------------------------
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '聊天消息ID',
  `session_id` bigint NOT NULL COMMENT '聊天会话ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息角色 user assistant system tool',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息内容',
  `content_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'text' COMMENT '消息内容类型',
  `model` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT 'AI模型名称',
  `prompt_tokens` int NULL DEFAULT 0 COMMENT '提示词token数',
  `completion_tokens` int NULL DEFAULT 0 COMMENT '回复token数',
  `total_tokens` int NULL DEFAULT 0 COMMENT '总token数',
  `latency_ms` int NULL DEFAULT 0 COMMENT 'AI回复耗时毫秒',
  `emotion_snapshot_json` json NULL COMMENT '消息情绪快照JSON',
  `safety_result_json` json NULL COMMENT '安全检测结果JSON',
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'success' COMMENT '消息状态',
  `error_message` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '错误信息',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_session_created`(`session_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_chat_messages_user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '聊天消息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of chat_messages
-- ----------------------------
INSERT INTO `chat_messages` VALUES (1, 1, 1, 'user', '1', 'text', '', 0, 0, 0, 0, '{}', '{}', 'success', '', '2026-07-01 13:51:27.961');
INSERT INTO `chat_messages` VALUES (2, 1, 1, 'assistant', '我理解你提到的感受。我们可以先把这件事拆小一点：刚才最影响你的念头是什么？', 'text', 'local-support-v1', 20, 37, 57, 0, '{}', '{\"risk\": \"low\"}', 'success', '', '2026-07-01 13:51:27.965');

-- ----------------------------
-- Table structure for chat_sessions
-- ----------------------------
DROP TABLE IF EXISTS `chat_sessions`;
CREATE TABLE `chat_sessions`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '聊天会话ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '会话标题',
  `scenario` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'emotional_support' COMMENT '咨询场景',
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT '会话状态',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '会话摘要',
  `upstream_conversation_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '上游AI会话ID',
  `last_message_at` datetime(3) NULL DEFAULT NULL COMMENT '最后消息时间',
  `message_count` int NULL DEFAULT 0 COMMENT '消息数量',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime(3) NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_last`(`user_id` ASC, `last_message_at` ASC) USING BTREE,
  INDEX `idx_chat_sessions_upstream_conversation_id`(`upstream_conversation_id` ASC) USING BTREE,
  INDEX `idx_chat_sessions_status`(`status` ASC) USING BTREE,
  INDEX `idx_chat_sessions_deleted_at`(`deleted_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '聊天会话表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of chat_sessions
-- ----------------------------
INSERT INTO `chat_sessions` VALUES (1, 1, '1', 'emotional_support', 'active', '', '', '2026-07-01 13:51:27.970', 2, '2026-07-01 13:51:27.951', '2026-07-01 13:51:27.970', NULL);

-- ----------------------------
-- Table structure for emotion_analyses
-- ----------------------------
DROP TABLE IF EXISTS `emotion_analyses`;
CREATE TABLE `emotion_analyses`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '情绪分析ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `source_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分析来源类型 diary chat_message manual',
  `source_id` bigint NULL DEFAULT NULL COMMENT '来源数据ID',
  `primary_emotion` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '主导情绪',
  `sentiment` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'neutral' COMMENT '情感倾向 positive neutral negative',
  `sentiment_score` decimal(5, 4) NULL DEFAULT 0.0000 COMMENT '情感分数 -1到1',
  `stress_score` int NULL DEFAULT 0 COMMENT '压力分数 0到100',
  `anxiety_score` int NULL DEFAULT 0 COMMENT '焦虑分数 0到100',
  `depression_risk_score` int NULL DEFAULT 0 COMMENT '抑郁风险分数 0到100',
  `energy_score` int NULL DEFAULT 0 COMMENT '能量分数 0到100',
  `confidence` decimal(5, 4) NULL DEFAULT 0.0000 COMMENT '分析置信度',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '分析摘要',
  `advice` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '建议内容',
  `risk_level` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'low' COMMENT '风险等级 low medium high crisis',
  `model` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '分析模型名称',
  `raw_result_json` json NULL COMMENT '原始分析结果JSON',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_created`(`user_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_emotion_analyses_source_type`(`source_type` ASC) USING BTREE,
  INDEX `idx_emotion_analyses_source_id`(`source_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '情绪分析表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of emotion_analyses
-- ----------------------------

-- ----------------------------
-- Table structure for emotion_daily_stats
-- ----------------------------
DROP TABLE IF EXISTS `emotion_daily_stats`;
CREATE TABLE `emotion_daily_stats`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '每日情绪统计ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `stat_date` date NOT NULL COMMENT '统计日期',
  `diary_count` int NULL DEFAULT 0 COMMENT '当日心情日记数量',
  `chat_count` int NULL DEFAULT 0 COMMENT '当日聊天消息数量',
  `avg_mood_score` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '平均心情分数',
  `avg_sentiment_score` decimal(5, 4) NULL DEFAULT 0.0000 COMMENT '平均情感分数',
  `dominant_emotion` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '当日主导情绪',
  `high_risk_count` bigint NULL DEFAULT 0 COMMENT '高风险分析次数',
  `dimension_summary` json NULL COMMENT '情绪维度汇总JSON',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_date`(`user_id` ASC, `stat_date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '每日情绪统计表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of emotion_daily_stats
-- ----------------------------

-- ----------------------------
-- Table structure for emotion_dimension_scores
-- ----------------------------
DROP TABLE IF EXISTS `emotion_dimension_scores`;
CREATE TABLE `emotion_dimension_scores`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '情绪维度分数ID',
  `analysis_id` bigint NOT NULL COMMENT '情绪分析ID',
  `dimension` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '情绪维度名称',
  `score` decimal(5, 4) NOT NULL COMMENT '维度分数 0到1',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_emotion_dimension_scores_analysis_id`(`analysis_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '情绪维度分数表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of emotion_dimension_scores
-- ----------------------------

-- ----------------------------
-- Table structure for file_assets
-- ----------------------------
DROP TABLE IF EXISTS `file_assets`;
CREATE TABLE `file_assets`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '文件资源ID',
  `owner_user_id` bigint NULL DEFAULT NULL COMMENT '所属用户ID',
  `biz_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '业务类型 avatar diary system',
  `storage_provider` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'local' COMMENT '存储服务商',
  `bucket` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '存储桶',
  `object_key` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '对象存储Key',
  `url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件访问地址',
  `mime_type` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '文件MIME类型',
  `size_bytes` bigint NULL DEFAULT 0 COMMENT '文件大小字节数',
  `checksum` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '文件校验值',
  `status` int NULL DEFAULT 1 COMMENT '文件状态',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime(3) NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_file_assets_owner_user_id`(`owner_user_id` ASC) USING BTREE,
  INDEX `idx_file_assets_biz_type`(`biz_type` ASC) USING BTREE,
  INDEX `idx_file_assets_deleted_at`(`deleted_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文件资源表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of file_assets
-- ----------------------------

-- ----------------------------
-- Table structure for login_logs
-- ----------------------------
DROP TABLE IF EXISTS `login_logs`;
CREATE TABLE `login_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '登录日志ID',
  `user_id` bigint NULL DEFAULT NULL COMMENT '用户ID',
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '登录用户名',
  `login_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'password' COMMENT '登录类型',
  `success` tinyint(1) NOT NULL COMMENT '是否登录成功',
  `fail_reason` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '失败原因',
  `ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '登录IP',
  `user_agent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '客户端User-Agent',
  `device_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '设备ID',
  `location` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '登录地理位置',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_login_logs_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_login_logs_username`(`username` ASC) USING BTREE,
  INDEX `idx_login_logs_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '登录日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of login_logs
-- ----------------------------
INSERT INTO `login_logs` VALUES (1, 1, '13800138000', 'password', 1, '', '127.0.0.1:56259', 'Apifox/1.0.0 (https://apifox.com)', '', '', '2026-07-01 11:41:16.327');
INSERT INTO `login_logs` VALUES (2, 0, 'testuser', 'password', 0, 'user_not_found', '127.0.0.1:55628', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '', '', '2026-07-01 13:47:32.901');
INSERT INTO `login_logs` VALUES (3, 1, '13800138000', 'password', 1, '', '127.0.0.1:55628', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '', '', '2026-07-01 13:49:33.226');
INSERT INTO `login_logs` VALUES (4, 1, '13800138000', 'password', 1, '', '127.0.0.1:57280', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '', '', '2026-07-01 14:07:16.049');
INSERT INTO `login_logs` VALUES (5, 1, '13800138000', 'password', 1, '', '127.0.0.1:64263', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '', '', '2026-07-01 14:50:14.239');
INSERT INTO `login_logs` VALUES (6, 1, '13800138000', 'password', 1, '', '127.0.0.1:57927', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '', '', '2026-07-01 16:47:15.357');
INSERT INTO `login_logs` VALUES (7, 1, '13800138000', 'password', 1, '', '127.0.0.1:51297', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '', '', '2026-07-01 17:37:10.845');
INSERT INTO `login_logs` VALUES (8, 2, '13800138001', 'password', 1, '', '127.0.0.1:59196', 'Apifox/1.0.0 (https://apifox.com)', '', '', '2026-07-01 18:13:00.652');

-- ----------------------------
-- Table structure for mood_diaries
-- ----------------------------
DROP TABLE IF EXISTS `mood_diaries`;
CREATE TABLE `mood_diaries`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '心情日记ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '日记标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '日记正文',
  `mood` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '心情类型',
  `mood_score` int NULL DEFAULT 0 COMMENT '心情分数 1到10',
  `weather` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '天气',
  `location` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '记录地点',
  `occurred_on` date NOT NULL COMMENT '日记发生日期',
  `visibility` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'private' COMMENT '可见性',
  `analysis_id` bigint NULL DEFAULT NULL COMMENT '关联情绪分析ID',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime(3) NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_day`(`user_id` ASC, `occurred_on` ASC) USING BTREE,
  INDEX `idx_mood_diaries_mood`(`mood` ASC) USING BTREE,
  INDEX `idx_mood_diaries_analysis_id`(`analysis_id` ASC) USING BTREE,
  INDEX `idx_mood_diaries_deleted_at`(`deleted_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '心情日记表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of mood_diaries
-- ----------------------------
INSERT INTO `mood_diaries` VALUES (1, 1, '测试', '测试', 'calm', 0, '', '', '2026-07-01', 'private', 0, '2026-07-01 14:01:27.387', '2026-07-01 14:01:27.387', NULL);
INSERT INTO `mood_diaries` VALUES (2, 1, '2026-07-01 心情日记', '变成恶气呃', 'calm', 0, '', '', '2026-07-01', 'private', 0, '2026-07-01 16:49:18.743', '2026-07-01 16:49:25.690', '2026-07-01 16:49:28.721');
INSERT INTO `mood_diaries` VALUES (3, 1, '2026-07-01 心情日记', '测试1', 'calm', 0, '', '', '2026-07-01', 'private', 0, '2026-07-01 16:49:32.933', '2026-07-01 16:49:38.238', NULL);

-- ----------------------------
-- Table structure for mood_diary_attachments
-- ----------------------------
DROP TABLE IF EXISTS `mood_diary_attachments`;
CREATE TABLE `mood_diary_attachments`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日记附件ID',
  `diary_id` bigint NOT NULL COMMENT '心情日记ID',
  `file_id` bigint NULL DEFAULT NULL COMMENT '文件资源ID',
  `url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '附件访问地址',
  `sort` int NULL DEFAULT 0 COMMENT '排序值',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_mood_diary_attachments_diary_id`(`diary_id` ASC) USING BTREE,
  INDEX `idx_mood_diary_attachments_file_id`(`file_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '心情日记附件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of mood_diary_attachments
-- ----------------------------

-- ----------------------------
-- Table structure for mood_diary_tags
-- ----------------------------
DROP TABLE IF EXISTS `mood_diary_tags`;
CREATE TABLE `mood_diary_tags`  (
  `diary_id` bigint NOT NULL COMMENT '心情日记ID',
  `tag_id` bigint NOT NULL COMMENT '心情标签ID',
  PRIMARY KEY (`diary_id`, `tag_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '心情日记标签关系表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of mood_diary_tags
-- ----------------------------

-- ----------------------------
-- Table structure for mood_tags
-- ----------------------------
DROP TABLE IF EXISTS `mood_tags`;
CREATE TABLE `mood_tags`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '心情标签ID',
  `user_id` bigint NULL DEFAULT 0 COMMENT '用户ID 0表示系统标签',
  `name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标签名称',
  `color` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '标签颜色',
  `icon` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '标签图标',
  `sort` int NULL DEFAULT 0 COMMENT '排序值',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime(3) NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_mood_tags_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_mood_tags_deleted_at`(`deleted_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '心情标签表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of mood_tags
-- ----------------------------

-- ----------------------------
-- Table structure for security_events
-- ----------------------------
DROP TABLE IF EXISTS `security_events`;
CREATE TABLE `security_events`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '安全事件ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `event_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '事件类型',
  `risk_level` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'low' COMMENT '风险等级',
  `ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '操作IP',
  `user_agent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '客户端User-Agent',
  `metadata_json` json NULL COMMENT '事件扩展信息JSON',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_security_events_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_security_events_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '安全事件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of security_events
-- ----------------------------

-- ----------------------------
-- Table structure for system_announcements
-- ----------------------------
DROP TABLE IF EXISTS `system_announcements`;
CREATE TABLE `system_announcements`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '系统公告ID',
  `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '公告标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '公告内容',
  `target_platform` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'all' COMMENT '目标平台',
  `start_at` datetime(3) NULL DEFAULT NULL COMMENT '生效开始时间',
  `end_at` datetime(3) NULL DEFAULT NULL COMMENT '生效结束时间',
  `status` int NULL DEFAULT 1 COMMENT '公告状态 1启用 0停用',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_system_announcements_target_platform`(`target_platform` ASC) USING BTREE,
  INDEX `idx_system_announcements_start_at`(`start_at` ASC) USING BTREE,
  INDEX `idx_system_announcements_end_at`(`end_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统公告表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_announcements
-- ----------------------------

-- ----------------------------
-- Table structure for system_configs
-- ----------------------------
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '系统配置ID',
  `config_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置键',
  `config_value` json NOT NULL COMMENT '配置值JSON',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '配置说明',
  `is_public` tinyint(1) NULL DEFAULT 0 COMMENT '是否公开给前端读取',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_system_configs_config_key`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_configs
-- ----------------------------

-- ----------------------------
-- Table structure for user_profiles
-- ----------------------------
DROP TABLE IF EXISTS `user_profiles`;
CREATE TABLE `user_profiles`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '资料ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `nickname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '昵称',
  `avatar_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '头像地址',
  `gender` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '性别',
  `birthday` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '生日',
  `bio` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '个人简介',
  `location` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '所在地区',
  `occupation` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '职业',
  `industry` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '行业',
  `language` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'zh-CN' COMMENT '语言偏好',
  `timezone` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '时区',
  `extra` json NULL COMMENT '扩展资料JSON',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime(3) NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_user_profiles_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_user_profiles_deleted_at`(`deleted_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户资料表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_profiles
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录用户名',
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码哈希值',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号',
  `email` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `avatar` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '头像地址',
  `roles` json NOT NULL COMMENT '角色列表JSON',
  `status` int NOT NULL DEFAULT 1 COMMENT '账号状态 1正常 2冻结 3注销',
  `last_login_at` datetime(3) NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime(3) NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) NULL DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime(3) NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_users_username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `idx_users_phone`(`phone` ASC) USING BTREE,
  UNIQUE INDEX `idx_users_email`(`email` ASC) USING BTREE,
  INDEX `idx_users_deleted_at`(`deleted_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户账号表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'testuser', '$2a$10$JhkW8fFz5SVOP/jItTWgJO5yBQKbvym04WtHrn34CTTqAL0x3UyLC', '13800138000', 'test@example.com', '', '[\"user\"]', 1, NULL, '2026-07-01 11:40:43.023', '2026-07-01 11:40:43.023', NULL);
INSERT INTO `users` VALUES (2, 'test', '$2a$10$vab4weV/dK5b7EJurOYlGOmvGX445tfV9/cU3Yg0J/d7vvpp1CkmO', '13800138001', 'tes@example.com', '', '[\"user\"]', 1, NULL, '2026-07-01 18:12:54.182', '2026-07-01 18:12:54.182', NULL);

SET FOREIGN_KEY_CHECKS = 1;
