CREATE TABLE `clients` (
  `id` smallint(6) NOT NULL,
  `commissionid` tinyint(4) NOT NULL,
  `name` tinytext NOT NULL,
  `nif` int(11) NOT NULL DEFAULT 999999990,
  `address` tinytext DEFAULT NULL,
  `maps` tinytext DEFAULT NULL,
  `mobile` bigint(20) DEFAULT NULL,
  `phone` bigint(20) DEFAULT NULL,
  `email` tinytext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `devices` (
  `id` smallint(6) NOT NULL,
  `clientid` smallint(6) NOT NULL,
  `brand` tinytext NOT NULL,
  `model` tinytext DEFAULT NULL,
  `serial` tinytext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `repairs` (
  `id` smallint(6) NOT NULL,
  `techid` tinyint(4) NOT NULL,
  `clientid` smallint(6) NOT NULL,
  `deviceid` smallint(6) DEFAULT NULL,
  `startdate` date NOT NULL,
  `description` text NOT NULL,
  `password` tinytext DEFAULT NULL,
  `battery` tinyint(1) NOT NULL DEFAULT 0,
  `charger` tinyint(1) NOT NULL DEFAULT 0,
  `cable` tinyint(1) NOT NULL DEFAULT 0,
  `bag` tinyint(1) NOT NULL DEFAULT 0,
  `other` tinytext DEFAULT NULL,
  `budget` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `delivered` tinyint(1) NOT NULL DEFAULT 0,
  `enddate` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` tinyint(2) NOT NULL,
  `username` tinytext NOT NULL,
  `displayname` tinytext NOT NULL,
  `password` tinytext NOT NULL,
  `accesstoken` tinytext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `repairs`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `displayname` (`displayname`(30)) USING HASH,
  ADD UNIQUE KEY `username` (`username`(30)) USING HASH;

ALTER TABLE `clients`
  MODIFY `id` smallint(6) NOT NULL AUTO_INCREMENT;

ALTER TABLE `devices`
  MODIFY `id` smallint(6) NOT NULL AUTO_INCREMENT;

ALTER TABLE `repairs`
  MODIFY `id` smallint(6) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` tinyint(2) NOT NULL AUTO_INCREMENT;