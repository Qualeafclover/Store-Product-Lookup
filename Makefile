DB_NAME ?= store_product_lookup
DB_USER ?= postgres
DB_HOST ?= localhost
DB_PORT ?= 5432
DB_PASSWORD ?= test
SERVER_PORT ?= 8080
MODEL_DIR := model/quantized
BACKEND_DIR := services

.PHONY: install install-packages install-backend download-model db-set-password start-services db-drop db-create db-schema db-reset serve

install: install-packages install-backend download-model db-set-password db-start db-reset start-services

install-packages:
	export NVM_DIR="$$HOME/.nvm" && \
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash && \
	. "$$NVM_DIR/nvm.sh" && \
	nvm install 24 && \
	nvm use 24
	sudo apt-get update
	sudo apt-get install -y postgresql postgresql-contrib unzip

install-backend:
	cd $(BACKEND_DIR) && npm install

download-model:
	cd $(MODEL_DIR) && wget 'https://drive.usercontent.google.com/download?id=15ZGFfIYz2GzKcBu6yshL3MqG1ej60S-j&export=download&confirm=t&uuid=f2ad812f-399e-4d51-b52f-9aa1721ed29f' -O model.zip && \
	unzip model.zip && \
	rm model.zip

db-set-password:
	sudo -u $(DB_USER) sh -lc "cd /tmp && psql -c \"ALTER USER $(DB_USER) WITH PASSWORD '$(DB_PASSWORD)';\""

start-services:
	sudo service postgresql start || sudo systemctl start postgresql

db-drop:
	sudo -u $(DB_USER) sh -lc 'cd /tmp && dropdb --if-exists $(DB_NAME)'

db-create:
	sudo -u $(DB_USER) sh -lc 'cd /tmp && psql -tc "SELECT 1 FROM pg_database WHERE datname = '\''$(DB_NAME)'\''" | grep -q 1 || createdb $(DB_NAME)'

db-schema:
	cp database/schema.sql /tmp/$(DB_NAME)-schema.sql
	sudo -u $(DB_USER) sh -lc 'cd /tmp && psql -d $(DB_NAME) -f /tmp/$(DB_NAME)-schema.sql'

db-reset: db-drop db-create db-schema

serve:
	@echo "Customer: http://localhost:$(SERVER_PORT)/customer/index.html"
	@echo "Store:    http://localhost:$(SERVER_PORT)/store/index.html"
	cd $(BACKEND_DIR) && \
		PORT=$(SERVER_PORT) \
		DB_HOST=$(DB_HOST) \
		DB_PORT=$(DB_PORT) \
		DB_USER=$(DB_USER) \
		DB_PASSWORD=$(DB_PASSWORD) \
		DB_NAME=$(DB_NAME) \
		npm run dev
