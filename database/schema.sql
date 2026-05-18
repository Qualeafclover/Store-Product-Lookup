DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS aisles;

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
    search_keywords TEXT,
    is_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO aisles (aisle_label, floor_level) VALUES 
('A-1', 1), 
('B-5', 1), 
('家電エリア', 2);

INSERT INTO products (name, category, price, stock_count, aisle_id, search_keywords, is_recommended) VALUES 
('ノートパソコン', '電化製品', 85000, 5, 3, 'PC, 軽量, 高性能', TRUE),
('ミネラルウォーター', '飲料', 100, 50, 1, '水, 備蓄, 500ml', FALSE),
('ぬいぐるみ', '玩具', 1500, 12, 2, 'プレゼント, 子供, クマ', TRUE);
