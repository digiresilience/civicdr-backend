# ⚙ Installation

## Dependencies

- Node 7.10.1+
- Postgres 9.4+ for database
- Yarn Package Manager

```
# Install node dependencies
yarn
```

## System Information

The API runs by default at `http://localhost:4040` . To accept outside traffic, we recommend you run a reverse proxy using Nginx or that would support `HTTPS` that forwards traffic to the server to the API. 

No ports need to be open other than web traffic ports `80` and `443` .

## Setup the Database

To run migrations, export the postgres URL to your environment and run `.scripts/setup_database.sh`

```
export DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:PORT/DATABASE_NAME
.scripts/setup_database.sh 
```
