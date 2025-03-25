#!/bin/bash

# Load environment variables from .env, ignoring comments and empty lines
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found. Please create it with MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, and MYSQL_DEMO_DATABASE."
    exit 1
fi

# Create SQL commands for database and user setup
SQL_SETUP=$(cat <<EOF
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';

CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE};
GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'localhost';

CREATE DATABASE IF NOT EXISTS ${MYSQL_DEMO_DATABASE};
GRANT ALL PRIVILEGES ON ${MYSQL_DEMO_DATABASE}.* TO '${MYSQL_USER}'@'localhost';

FLUSH PRIVILEGES;
EOF
)

# Execute the SQL setup
echo "$SQL_SETUP" | sudo mysql -u root -p

# Apply the database structure to both databases
sudo mysql -u root -p ${MYSQL_DATABASE} < database_structure.sql
sudo mysql -u root -p ${MYSQL_DEMO_DATABASE} < database_structure.sql



# make script executable
# chmod +x setup_mysql.sh
# run the script
# ./setup_mysql.sh