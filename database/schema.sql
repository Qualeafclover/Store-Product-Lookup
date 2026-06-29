DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS aisles;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE aisles (
    id SERIAL PRIMARY KEY,
    aisle_name TEXT NOT NULL
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    aisle_id INTEGER REFERENCES aisles(id),
    encoded_vector VECTOR(256)  -- 256次元のベクトルを格納するカラム
);

-- INSERT INTO aisles (aisle_name)
-- VALUES
--     ('A-1'),
--     ('B-5'),
--     ('家電エリア');

-- INSERT INTO products (name, description, price, aisle_id, encoded_vector)
-- VALUES
--     ('ノートパソコン', '高性能で軽量なビジネス向けPC', 85000, (SELECT id FROM aisles WHERE aisle_name = '家電エリア'), '[0.12, 0.88, 0.45]'::VECTOR),
--     ('ミネラルウォーター', '富士山の天然水 500ml', 100, (SELECT id FROM aisles WHERE aisle_name = 'A-1'), '[0.01, 0.05, 0.99]'::VECTOR),
--     ('ぬいぐるみ', '肌触りの良いクマのぬいぐるみ', 1500, (SELECT id FROM aisles WHERE aisle_name = 'B-5'), '[0.75, 0.22, 0.10]'::VECTOR);
