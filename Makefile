DB_NAME ?= store_product_lookup
DB_USER ?= postgres
DB_HOST ?= localhost
DB_PORT ?= 5432
DB_PASSWORD ?= pangsaupass
BACKEND_DIR := services

.PHONY: install install-node install-postgres install-backend db-start db-drop db-create db-schema db-reset backend-run customer-serve store-serve

install: install-node install-postgres install-backend

install-node:
	sudo apt-get update
	sudo apt-get install -y nodejs npm

install-postgres:
	sudo apt-get update
	sudo apt-get install -y postgresql postgresql-contrib

install-backend:
	cd $(BACKEND_DIR) && npm install

db-set-password:
	sudo -u $(DB_USER) psql -c "ALTER USER $(DB_USER) WITH PASSWORD '$(DB_PASSWORD)';"

db-start:
	sudo service postgresql start || sudo systemctl start postgresql

db-stop:
	sudo service postgresql stop || sudo systemctl stop postgresql

db-drop:
	sudo -u $(DB_USER) sh -lc 'cd /tmp && dropdb --if-exists $(DB_NAME)'

db-create:
	sudo -u $(DB_USER) sh -lc 'cd /tmp && psql -tc "SELECT 1 FROM pg_database WHERE datname = '\''$(DB_NAME)'\''" | grep -q 1 || createdb $(DB_NAME)'

db-schema:
	cp database/schema.sql /tmp/$(DB_NAME)-schema.sql
	sudo -u $(DB_USER) sh -lc 'cd /tmp && psql -d $(DB_NAME) -f /tmp/$(DB_NAME)-schema.sql'

db-reset: db-drop db-create db-schema

backend-run:
	cd $(BACKEND_DIR) && \
		DB_HOST=$(DB_HOST) \
		DB_PORT=$(DB_PORT) \
		DB_USER=$(DB_USER) \
		DB_PASSWORD=$(DB_PASSWORD) \
		DB_NAME=$(DB_NAME) \
		npm run dev

customer-serve:
	cd apps/customer && python3 -m http.server 5500 --bind 0.0.0.0

store-serve:
	cd apps/store && python3 -m http.server 5501 --bind 0.0.0.0
