DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS aisles;

CREATE TABLE aisles (
    id SERIAL PRIMARY KEY,
    aisle_label TEXT NOT NULL
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                 
    description TEXT,                    
    price NUMERIC(10, 2) NOT NULL,       
    aisle_id INTEGER REFERENCES aisles(id) 
);

INSERT INTO aisles (aisle_label)
VALUES
    ('A-1'),
    ('B-5'),
    ('家電エリア');

INSERT INTO products (name, description, price, aisle_id)
VALUES
    ('ノートパソコン', '高性能で軽量なビジネス向けPC', 85000, (SELECT id FROM aisles WHERE aisle_label = '家電エリア')),
    ('ミネラルウォーター', '富士山の天然水 500ml', 100, (SELECT id FROM aisles WHERE aisle_label = 'A-1')),
    ('ぬいぐるみ', '肌触りの良いクマのぬいぐるみ', 1500, (SELECT id FROM aisles WHERE aisle_label = 'B-5'));
