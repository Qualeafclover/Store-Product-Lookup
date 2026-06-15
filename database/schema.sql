DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS aisles;

CREATE TABLE aisles (
    id SERIAL PRIMARY KEY,
    aisle_label TEXT NOT NULL,
    description TEXT
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                 
    description TEXT,                    
    price NUMERIC(10, 2) NOT NULL,       
    aisle_id INTEGER REFERENCES aisles(id) 
)
WITH inserted_aisles AS (
    INSERT INTO aisles (aisle_label) VALUES 
    ('A-1'), 
    ('B-5'), 
    ('家電エリア')
    RETURNING id, aisle_label
)
INSERT INTO products (name, description, price, aisle_id)
SELECT 'ノートパソコン', '高性能で軽量なビジネス向けPC', 85000, id FROM inserted_aisles WHERE aisle_label = '家電エリア'
UNION ALL
SELECT 'ミネラルウォーター', '富士山の天然水 500ml', 100, id FROM inserted_aisles WHERE aisle_label = 'A-1'
UNION ALL
SELECT 'ぬいぐるみ', '肌触りの良いクマのぬいぐるみ', 1500, id FROM inserted_aisles WHERE aisle_label = 'B-5';
