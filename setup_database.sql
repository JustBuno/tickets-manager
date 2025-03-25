-- Create user if it doesn't exist
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';

-- Create the first database
CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE};

-- Grant privileges to the first database
GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'localhost';

-- Create the second database
CREATE DATABASE IF NOT EXISTS ${MYSQL_DEMO_DATABASE};

-- Grant privileges to the second database
GRANT ALL PRIVILEGES ON ${MYSQL_DEMO_DATABASE}.* TO '${MYSQL_USER}'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;