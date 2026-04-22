DROP TABLE IF EXISTS test_table;

CREATE TABLE test_table (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_table (name, category, price, in_stock) VALUES
    ('Notebook', 'Stationery', 4.99, TRUE),
    ('Water Bottle', 'Lifestyle', 14.50, TRUE),
    ('Desk Lamp', 'Office', 32.00, FALSE),
    ('USB-C Cable', 'Electronics', 9.75, TRUE),
    ('Backpack', 'Travel', 49.00, TRUE);
