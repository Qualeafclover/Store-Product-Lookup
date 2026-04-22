DB_NAME ?= store_product_lookup
DB_USER ?= postgres
BACKEND_DIR := services

.PHONY: install install-node install-postgres db-start db-drop db-create db-schema db-reset backend-install backend-run

install: install-node install-postgres

install-node:
	sudo apt-get update
	sudo apt-get install -y nodejs npm

install-postgres:
	sudo apt-get update
	sudo apt-get install -y postgresql postgresql-contrib

db-start:
	sudo service postgresql start || sudo systemctl start postgresql

db-drop:
	sudo -u $(DB_USER) sh -lc 'cd /tmp && dropdb --if-exists $(DB_NAME)'

db-create:
	sudo -u $(DB_USER) sh -lc 'cd /tmp && psql -tc "SELECT 1 FROM pg_database WHERE datname = '\''$(DB_NAME)'\''" | grep -q 1 || createdb $(DB_NAME)'

db-schema:
	cp database/schema.sql /tmp/$(DB_NAME)-schema.sql
	sudo -u $(DB_USER) sh -lc 'cd /tmp && psql -d $(DB_NAME) -f /tmp/$(DB_NAME)-schema.sql'

db-reset: db-drop db-create db-schema

backend-install:
	cd $(BACKEND_DIR) && npm install

backend-run:
	cd $(BACKEND_DIR) && npm run dev
