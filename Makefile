MODEL_DIR := model/quantized
MODEL_ZIP := $(MODEL_DIR)/model.zip
MODEL_URL := https://drive.usercontent.google.com/download?id=1GRvlXweqZWDoSCYpnwLWbUSnI2B8dkkH&export=download&confirm=t&uuid=79923bb2-6725-4432-a91b-cdb5a9724967
# MODEL_URL := https://drive.usercontent.google.com/download?id=15ZGFfIYz2GzKcBu6yshL3MqG1ej60S-j&export=download&confirm=t&uuid=f2ad812f-399e-4d51-b52f-9aa1721ed29f

.PHONY: download-model

download-model:
	mkdir -p $(MODEL_DIR)
	wget '$(MODEL_URL)' -O $(MODEL_ZIP)
	unzip -o $(MODEL_ZIP) -d $(MODEL_DIR)
	rm $(MODEL_ZIP)
