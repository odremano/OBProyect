-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: barberia_system
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add Usuario del Sistema',6,'add_usuario'),(22,'Can change Usuario del Sistema',6,'change_usuario'),(23,'Can delete Usuario del Sistema',6,'delete_usuario'),(24,'Can view Usuario del Sistema',6,'view_usuario'),(25,'Can add Servicio Ofrecido',7,'add_servicio'),(26,'Can change Servicio Ofrecido',7,'change_servicio'),(27,'Can delete Servicio Ofrecido',7,'delete_servicio'),(28,'Can view Servicio Ofrecido',7,'view_servicio'),(29,'Can add Profesional del Servicio',8,'add_profesional'),(30,'Can change Profesional del Servicio',8,'change_profesional'),(31,'Can delete Profesional del Servicio',8,'delete_profesional'),(32,'Can view Profesional del Servicio',8,'view_profesional'),(33,'Can add Turno',9,'add_turno'),(34,'Can change Turno',9,'change_turno'),(35,'Can delete Turno',9,'delete_turno'),(36,'Can view Turno',9,'view_turno'),(37,'Can add Horario de Disponibilidad',10,'add_horariodisponibilidad'),(38,'Can change Horario de Disponibilidad',10,'change_horariodisponibilidad'),(39,'Can delete Horario de Disponibilidad',10,'delete_horariodisponibilidad'),(40,'Can view Horario de Disponibilidad',10,'view_horariodisponibilidad'),(41,'Can add Bloqueo de Horario',11,'add_bloqueohorario'),(42,'Can change Bloqueo de Horario',11,'change_bloqueohorario'),(43,'Can delete Bloqueo de Horario',11,'delete_bloqueohorario'),(44,'Can view Bloqueo de Horario',11,'view_bloqueohorario');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bloqueo_horario`
--

DROP TABLE IF EXISTS `bloqueo_horario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloqueo_horario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profesional_id` int NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `reason` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_profesional_id` (`profesional_id`),
  KEY `idx_start_datetime` (`start_datetime`),
  KEY `idx_end_datetime` (`end_datetime`),
  KEY `idx_block_search` (`profesional_id`,`start_datetime`,`end_datetime`),
  CONSTRAINT `bloqueo_horario_ibfk_1` FOREIGN KEY (`profesional_id`) REFERENCES `profesional` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_datetime_valid` CHECK ((`end_datetime` > `start_datetime`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bloqueo_horario`
--

LOCK TABLES `bloqueo_horario` WRITE;
/*!40000 ALTER TABLE `bloqueo_horario` DISABLE KEYS */;
/*!40000 ALTER TABLE `bloqueo_horario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(4,'contenttypes','contenttype'),(11,'core','bloqueohorario'),(10,'core','horariodisponibilidad'),(8,'core','profesional'),(7,'core','servicio'),(9,'core','turno'),(6,'core','usuario'),(5,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2025-06-26 20:09:52.206073'),(2,'contenttypes','0002_remove_content_type_name','2025-06-26 20:09:52.414851'),(3,'auth','0001_initial','2025-06-26 20:09:52.824560'),(4,'auth','0002_alter_permission_name_max_length','2025-06-26 20:09:52.919048'),(5,'auth','0003_alter_user_email_max_length','2025-06-26 20:09:52.928570'),(6,'auth','0004_alter_user_username_opts','2025-06-26 20:09:52.936637'),(7,'auth','0005_alter_user_last_login_null','2025-06-26 20:09:52.947065'),(8,'auth','0006_require_contenttypes_0002','2025-06-26 20:09:52.951501'),(9,'auth','0007_alter_validators_add_error_messages','2025-06-26 20:09:52.961653'),(10,'auth','0008_alter_user_username_max_length','2025-06-26 20:09:52.970704'),(11,'auth','0009_alter_user_last_name_max_length','2025-06-26 20:09:52.981603'),(12,'auth','0010_alter_group_name_max_length','2025-06-26 20:09:53.001300'),(13,'auth','0011_update_proxy_permissions','2025-06-26 20:09:53.010832'),(14,'auth','0012_alter_user_first_name_max_length','2025-06-26 20:09:53.019251'),(15,'core','0001_initial','2025-06-26 20:10:03.542437'),(16,'admin','0001_initial','2025-06-26 20:13:31.925135'),(17,'admin','0002_logentry_remove_auto_add','2025-06-26 20:13:31.940831'),(18,'admin','0003_logentry_add_action_flag_choices','2025-06-26 20:13:31.940831'),(19,'sessions','0001_initial','2025-06-26 20:13:32.004310');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('92ugkjehn50m7g4xg797zabuvq3zm44j','.eJxVjEEOwiAQRe_C2hCIwIBL956BDMMgVQNJaVeNd9cmXej2v_f-JiKuS43r4DlOWVyEE6ffLSE9ue0gP7Ddu6TelnlKclfkQYe89cyv6-H-HVQc9VsrrxEIuVhLQdvgiBRY8lCytx5D5rNBbRIBa3YG0aAtmBRkTsVpEO8P-Zc4zA:1uUsze:_y3I3MjQ3hMePw8JQnLOE91rPkV9jlJ4H6r9x3F1_pw','2025-07-10 20:14:46.319617');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horario_disponibilidad`
--

DROP TABLE IF EXISTS `horario_disponibilidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horario_disponibilidad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profesional_id` int NOT NULL,
  `day_of_week` tinyint NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_recurring` tinyint(1) NOT NULL DEFAULT '1',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_profesional_id` (`profesional_id`),
  KEY `idx_day_of_week` (`day_of_week`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_end_time` (`end_time`),
  KEY `idx_is_recurring` (`is_recurring`),
  KEY `idx_availability_search` (`profesional_id`,`day_of_week`,`start_time`,`end_time`),
  CONSTRAINT `horario_disponibilidad_ibfk_1` FOREIGN KEY (`profesional_id`) REFERENCES `profesional` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_time_valid` CHECK ((`end_time` > `start_time`)),
  CONSTRAINT `horario_disponibilidad_chk_1` CHECK (((`day_of_week` >= 0) and (`day_of_week` <= 6)))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horario_disponibilidad`
--

LOCK TABLES `horario_disponibilidad` WRITE;
/*!40000 ALTER TABLE `horario_disponibilidad` DISABLE KEYS */;
INSERT INTO `horario_disponibilidad` VALUES (1,1,0,'09:00:00','18:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(2,1,1,'09:00:00','18:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(3,1,2,'09:00:00','18:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(4,1,3,'09:00:00','18:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(5,1,4,'09:00:00','18:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(6,2,0,'10:00:00','19:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(7,2,1,'10:00:00','19:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(8,2,2,'10:00:00','19:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(9,2,3,'10:00:00','19:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(10,2,4,'10:00:00','19:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(11,2,5,'10:00:00','16:00:00',1,NULL,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04');
/*!40000 ALTER TABLE `horario_disponibilidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profesional`
--

DROP TABLE IF EXISTS `profesional`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profesional` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `profile_picture_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_available` (`is_available`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profesional`
--

LOCK TABLES `profesional` WRITE;
/*!40000 ALTER TABLE `profesional` DISABLE KEYS */;
INSERT INTO `profesional` VALUES (1,2,'Especialista en cortes modernos y clásicos con 5 años de experiencia',NULL,1,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(2,3,'Experta en tratamientos faciales y cuidado de barba',NULL,1,'2025-06-26 17:09:04','2025-06-26 17:09:04');
/*!40000 ALTER TABLE `profesional` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicio`
--

DROP TABLE IF EXISTS `servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `duration_minutes` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_price` (`price`),
  CONSTRAINT `servicio_chk_1` CHECK ((`duration_minutes` > 0)),
  CONSTRAINT `servicio_chk_2` CHECK ((`price` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicio`
--

LOCK TABLES `servicio` WRITE;
/*!40000 ALTER TABLE `servicio` DISABLE KEYS */;
INSERT INTO `servicio` VALUES (1,'Corte de Pelo','Corte de pelo clásico o moderno',30,25.00,1,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(2,'Barba','Arreglo y modelado de barba',20,15.00,1,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(3,'Corte + Barba','Corte de pelo y arreglo de barba',45,35.00,1,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(4,'Manicura','Cuidado y arreglo de uñas',30,20.00,1,'2025-06-26 17:09:04','2025-06-26 17:09:04'),(5,'Pedicura','Cuidado y arreglo de pies',45,25.00,1,'2025-06-26 17:09:04','2025-06-26 17:09:04');
/*!40000 ALTER TABLE `servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `turno`
--

DROP TABLE IF EXISTS `turno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turno` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `profesional_id` int NOT NULL,
  `servicio_id` int NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `status` enum('pendiente','confirmado','cancelado','completado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cliente_id` (`cliente_id`),
  KEY `idx_profesional_id` (`profesional_id`),
  KEY `idx_servicio_id` (`servicio_id`),
  KEY `idx_start_datetime` (`start_datetime`),
  KEY `idx_end_datetime` (`end_datetime`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_appointment_search` (`profesional_id`,`start_datetime`,`end_datetime`,`status`),
  CONSTRAINT `turno_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `turno_ibfk_2` FOREIGN KEY (`profesional_id`) REFERENCES `profesional` (`id`) ON DELETE CASCADE,
  CONSTRAINT `turno_ibfk_3` FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_turno_datetime_valid` CHECK ((`end_datetime` > `start_datetime`))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `turno`
--

LOCK TABLES `turno` WRITE;
/*!40000 ALTER TABLE `turno` DISABLE KEYS */;
/*!40000 ALTER TABLE `turno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('cliente','profesional','administrador') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cliente',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_staff` tinyint(1) NOT NULL DEFAULT '0',
  `is_superuser` tinyint(1) NOT NULL DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `date_joined` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'admin','admin@barberia.com','hashed_password_here','Administrador','Sistema','123456789','administrador',1,0,0,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04','2025-06-26 17:09:04'),(2,'juan_prof','juan@barberia.com','hashed_password_here','Juan','Pérez','987654321','profesional',1,0,0,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04','2025-06-26 17:09:04'),(3,'maria_prof','maria@barberia.com','hashed_password_here','María','García','555123456','profesional',1,0,0,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04','2025-06-26 17:09:04'),(4,'cliente1','cliente1@email.com','hashed_password_here','Carlos','López','111222333','cliente',1,0,0,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04','2025-06-26 17:09:04'),(5,'cliente2','cliente2@email.com','hashed_password_here','Ana','Martínez','444555666','cliente',1,0,0,NULL,'2025-06-26 17:09:04','2025-06-26 17:09:04','2025-06-26 17:09:04'),(6,'odreman','jaosodreman@gmail.com','pbkdf2_sha256$1000000$qyJuoj4MdDGKLPHJ7uYFER$IkgtB6IBv76PuGuxi2zLYR6qO6bDHUwcWekJPVwLBIM=','','',NULL,'cliente',1,1,1,'2025-06-26 20:14:46','2025-06-26 20:14:28','2025-06-26 20:14:29','2025-06-26 17:14:46');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_disponibilidad_profesionales`
--

DROP TABLE IF EXISTS `v_disponibilidad_profesionales`;
/*!50001 DROP VIEW IF EXISTS `v_disponibilidad_profesionales`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_disponibilidad_profesionales` AS SELECT 
 1 AS `profesional_id`,
 1 AS `profesional_nombre`,
 1 AS `profesional_apellido`,
 1 AS `day_of_week`,
 1 AS `start_time`,
 1 AS `end_time`,
 1 AS `is_recurring`,
 1 AS `start_date`,
 1 AS `end_date`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_turnos_completos`
--

DROP TABLE IF EXISTS `v_turnos_completos`;
/*!50001 DROP VIEW IF EXISTS `v_turnos_completos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_turnos_completos` AS SELECT 
 1 AS `id`,
 1 AS `start_datetime`,
 1 AS `end_datetime`,
 1 AS `status`,
 1 AS `notes`,
 1 AS `created_at`,
 1 AS `cliente_id`,
 1 AS `cliente_username`,
 1 AS `cliente_nombre`,
 1 AS `cliente_apellido`,
 1 AS `cliente_telefono`,
 1 AS `profesional_id`,
 1 AS `profesional_username`,
 1 AS `profesional_nombre`,
 1 AS `profesional_apellido`,
 1 AS `profesional_bio`,
 1 AS `servicio_id`,
 1 AS `servicio_nombre`,
 1 AS `servicio_descripcion`,
 1 AS `duration_minutes`,
 1 AS `price`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_disponibilidad_profesionales`
--

/*!50001 DROP VIEW IF EXISTS `v_disponibilidad_profesionales`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_disponibilidad_profesionales` AS select `p`.`id` AS `profesional_id`,`u`.`first_name` AS `profesional_nombre`,`u`.`last_name` AS `profesional_apellido`,`hd`.`day_of_week` AS `day_of_week`,`hd`.`start_time` AS `start_time`,`hd`.`end_time` AS `end_time`,`hd`.`is_recurring` AS `is_recurring`,`hd`.`start_date` AS `start_date`,`hd`.`end_date` AS `end_date` from ((`profesional` `p` join `usuario` `u` on((`p`.`user_id` = `u`.`id`))) join `horario_disponibilidad` `hd` on((`p`.`id` = `hd`.`profesional_id`))) where ((`p`.`is_available` = true) and (`hd`.`is_recurring` = true)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_turnos_completos`
--

/*!50001 DROP VIEW IF EXISTS `v_turnos_completos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_turnos_completos` AS select `t`.`id` AS `id`,`t`.`start_datetime` AS `start_datetime`,`t`.`end_datetime` AS `end_datetime`,`t`.`status` AS `status`,`t`.`notes` AS `notes`,`t`.`created_at` AS `created_at`,`c`.`id` AS `cliente_id`,`c`.`username` AS `cliente_username`,`c`.`first_name` AS `cliente_nombre`,`c`.`last_name` AS `cliente_apellido`,`c`.`phone_number` AS `cliente_telefono`,`p`.`id` AS `profesional_id`,`u`.`username` AS `profesional_username`,`u`.`first_name` AS `profesional_nombre`,`u`.`last_name` AS `profesional_apellido`,`p`.`bio` AS `profesional_bio`,`s`.`id` AS `servicio_id`,`s`.`name` AS `servicio_nombre`,`s`.`description` AS `servicio_descripcion`,`s`.`duration_minutes` AS `duration_minutes`,`s`.`price` AS `price` from ((((`turno` `t` join `usuario` `c` on((`t`.`cliente_id` = `c`.`id`))) join `profesional` `p` on((`t`.`profesional_id` = `p`.`id`))) join `usuario` `u` on((`p`.`user_id` = `u`.`id`))) join `servicio` `s` on((`t`.`servicio_id` = `s`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-26 18:43:52
