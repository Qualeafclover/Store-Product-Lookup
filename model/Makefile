UV_CACHE_DIR := .uv-cache

.PHONY: install sync lock update clean

install: sync

sync:
	UV_CACHE_DIR=$(UV_CACHE_DIR) uv sync --no-install-project

lock:
	UV_CACHE_DIR=$(UV_CACHE_DIR) uv lock

update:
	UV_CACHE_DIR=$(UV_CACHE_DIR) uv sync --upgrade --no-install-project

clean:
	rm -rf .venv $(UV_CACHE_DIR) quantized/*/

quantize:
	UV_CACHE_DIR=$(UV_CACHE_DIR) uv run python quantize.py