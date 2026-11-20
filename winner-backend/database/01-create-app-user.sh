#!/bin/sh
# Executé une seule fois par l'image MySQL lors de l'initialisation d'un volume neuf.
# Le compte applicatif ne reçoit que les permissions requises dans winner_db.
set -eu

case "${MYSQL_APP_PASSWORD:-}" in
  ''|*[!a-fA-F0-9]*)
    echo "MYSQL_APP_PASSWORD doit être un secret hexadécimal généré aléatoirement." >&2
    exit 1
    ;;
esac

MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --protocol=socket -uroot <<SQL
CREATE USER IF NOT EXISTS 'winner_app'@'%' IDENTIFIED BY '${MYSQL_APP_PASSWORD}';
ALTER USER 'winner_app'@'%' IDENTIFIED BY '${MYSQL_APP_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON winner_db.* TO 'winner_app'@'%';
FLUSH PRIVILEGES;
SQL
