# pikachu

Open source [Delivery CDP](https://www.cdpinstitute.org/learning-center/what-is-a-cdp/) that provide tools to help finding hypothesis, run experiments, analyze result, finally automate campaigns all based on customer data.

## What is Delivery CDP?

![Features](images/features.png)

## Architecture Overview

![Architecture](images/architecture.png)

## Getting started

### 1. checkout code

```bash
git clone https://github.com/SteamShon/pikachu.git
cd pikachu
```

### 2. create .env file

```
# Prisma

# https://www.prisma.io/docs/reference/database-reference/connection-urls
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres?schema=public

# NextAuth.js

# https://next-auth.js.org/providers/google
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# App configuration

# polling interval to fetch updated AdMeta(ex: Campaign/AdGroup/Creative) from database.
AD_META_SYNC_PERIOD_MILLIS=10000
```

Chagen DATABASE_URL to your database. The default configuration use postgresql, so if you are using different database, db.provider value in dashboard/prisma/schema.prisma need to be changed accordingly.

### 3. Build Docker Images

```bash
docker compose up
```

The result shoul looks following.

```bash
CONTAINER ID   IMAGE                COMMAND                  CREATED          STATUS                    PORTS                    NAMES
7ae0c328cdc1   pikachu-dashboard    "docker-entrypoint.s…"   26 seconds ago   Up 23 seconds             0.0.0.0:3000->3000/tcp   pikachu-dashboard-1
ea8eb4c937f5   pikachu-server       "./server"               2 days ago       Up 22 seconds             0.0.0.0:8080->8080/tcp   pikachu-server-1
8991273ccfd9   postgres:12-alpine   "docker-entrypoint.s…"   2 days ago       Up 17 minutes (healthy)   0.0.0.0:5432->5432/tcp   pikachu-postgres-1
```

now goes to http://localhost:3000 to connect dashboard.
