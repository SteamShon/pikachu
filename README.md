# pikachu

Open source [Delivery CDP](https://www.cdpinstitute.org/learning-center/what-is-a-cdp/) that provide tools to help finding hypothesis, run experiments, analyze result, finally automate campaigns all based on customer data.

## What is Delivery CDP?

![Features](images/features.png)


## Features

Pikachu includes the following features:

- **Dynamic Placement Creation**: This feature allows you to create placements dynamically for your application. Each placement has its own schema, which can be easily integrated into the main application pages without requiring any effort from developers. By following the same protocol for each placement, you can automate the content creation and development process, making it easier to add and manage new types of content in your application.
- **Visual Content Creation and CMS Integration**: This feature provides a visual webpage builder (such as GrapesJS) that allows non-technical users to create and edit content easily. Generated html/react component can then be delivered to the placement using an API. Additionally, Pikachu can integrate with external content management systems to sync content that has been published on those systems.
- **Customer Segmentation Targeting on Advertising Hierarchy**: This feature enables you to create and manage campaigns and ads using a hierarchical structure (campaign/ad group/creative) that makes it easy to organize and track your advertising efforts. You can then target specific customer segments by creating custom segments based on customer features and use these segments to run A/B experiments on your content. This feature makes it easy to tailor your campaigns to specific audiences, and by using customer segmentation, you can improve the relevance of your content and increase its effectiveness.
- **Content Ranking with Analytics and Optimization**: This feature provides analytics on campaign, ad group, and creative performance, allowing you to diagnose how each piece of content is performing. You can use this information to optimize your campaigns and improve their effectiveness. Pikachu also provides a default ranking algorithm that can automatically rank your content based on its performance and adjust the weighting of each piece of content in real time(Multi-Armed-Bandit)

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
