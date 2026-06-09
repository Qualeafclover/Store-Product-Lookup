DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS aisles;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE aisles (
    id SERIAL PRIMARY KEY,
    aisle_label TEXT NOT NULL,
    floor_level INTEGER DEFAULT 1,
    description TEXT
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock_count INTEGER DEFAULT 0,
    aisle_id INTEGER REFERENCES aisles(id),
    description_summary TEXT,
    encoded_vector VECTOR(3),
    is_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

WITH inserted_aisles AS (
    INSERT INTO aisles (aisle_label, floor_level) VALUES 
    ('A-1', 1), 
    ('B-5', 1), 
    ('家電エリア', 2)
    RETURNING id, aisle_label
)
INSERT INTO products (name, category, price, stock_count, aisle_id, description_summary, encoded_vector, is_recommended)
SELECT 'ノートパソコン', '電化製品', 85000, 5, id, '高性能で軽量なビジネス向けPC', '[0.12, 0.88, 0.45]'::VECTOR, TRUE FROM inserted_aisles WHERE aisle_label = '家電エリア'
UNION ALL
SELECT 'ミネラルウォーター', '飲料', 100, 50, id, '富士山の天然水 500ml', '[0.01, 0.05, 0.99]'::VECTOR, FALSE FROM inserted_aisles WHERE aisle_label = 'A-1'
UNION ALL
SELECT 'ぬいぐるみ', '玩具', 1500, 12, id, '肌触りの良いクマのぬいぐるみ', '[0.75, 0.22, 0.10]'::VECTOR, TRUE FROM inserted_aisles WHERE aisle_label = 'B-5';
