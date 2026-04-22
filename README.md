```bash
# Installs: nodejs, postgresql, backend packages
make install
# Starts DB session
make db-start
# Sets DB user password (can be changed)
make db-set-password
# Resets DB based on the database schema
make db-reset
```

```bash
# Run the backend server
make backend-run
```
```bash
# Run the frontend servers
make customer-serve
make store-serve
```

```bash
# Enter the database manually
psql -h localhost -p 5432 -U postgres -d postgres
```

```bash
# Stop DB server
make db-stop
```