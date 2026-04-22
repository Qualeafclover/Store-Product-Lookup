```bash
# Installs: nodejs, postgresql, backend packages
make install
# Sets DB user password (can be changed)
make db-set-password
# Starts DB session
make db-start
# Resets DB based on the database schema
make db-reset
# Run the backend server
make backend-run
```

```bash
# Enter the database manually
psql -h localhost -p 5432 -U postgres -d postgres
```