DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (sku, name, category, price, in_stock) VALUES
    ('SKU-1001', 'Notebook', 'Stationery', 4.99, TRUE),
    ('SKU-1002', 'Water Bottle', 'Lifestyle', 14.50, TRUE),
    ('SKU-1003', 'Desk Lamp', 'Office', 32.00, FALSE),
    ('SKU-1004', 'USB-C Cable', 'Electronics', 9.75, TRUE),
    ('SKU-1005', 'Backpack', 'Travel', 49.00, TRUE);
