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
- **Content Delivery and Push Notifications**: Pikachu provides a simple way to inject contents into placements for display and serve them to your customers. Additionally, you can send push notifications to your customers using our push notification service. This feature enables you to reach your customers with personalized content and messages, improving their experience and engagement with your brand.

## Architecture Overview

![Architecture](images/architecture.png)

## Project Layout

- [x] dashboard: nextjs application that provide user interface.
- [x] server/api: API server that filtering/ranking on registered contents per user request.
- [ ] server/event: HTTP proxy for collecting SDK's user interactions, ingest to Kafka.
- [ ] job/stat: the default ETL jobs to calculate statistics on creatives.
- [ ] job/cube: the default ETL jobs to build cube.
- [ ] job/message: the default implementations to send app push notification.

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

### 4. Create an account and connect a data source

When you first access the Pikachu dashboard, you'll be prompted to create an account and service(workspace). After creating an account, you'll need to connect a data source to Pikachu. Currently, Pikachu supports data sources in the form of parquet files on AWS s3.

Once registering your AWS S3 configuration on your service, then set S3 files for your customer dataset as a cube so pikachu can use this cube to build customer segments and calculate populations.

The usual cube consists of customer's unique id with their features with key/value pairs. Pikachu provide the default ETL job that transform read user's interactions from SDK(raw data) into cube which can be replaced by own pipeline.

Example cube.

| user_id | age | gender | interests      | purchased_items | notification_settings | last_week_visited | ... |
| ------- | --- | ------ | -------------- | --------------- | --------------------- | ----------------- | --- |
| dfk12j3 | 30  | M      | food,IT,sports | 3,15,102        | noti_1,noti_3         | true              |     |

Pikachu provide 2 operation on this dataset.

- OLAP: find out the list of rows that satisfy given filter
  - ex) find out users who (age=30 and interests in IT) or (age=40 and last_week_visited)
  - default integration done with DuckDB on AWS S3 parquet files.
- OLTP: fetch necessary features for given customer
  - default integration done with postgresql.

### 5. Create a placement and experiment

nce you've connected a data source, you can create a placement to display content. To create a placement, go to the "Placements" tab in the dashboard and click the "Create Placement" button. Follow the prompts to create a placement and select the data source you want to use.

Placement should have one contentType to decide how contents registered under this placement should delivered at your App.

Followings are types of supported contentTypes.

#### ContentType

- Page type: a full page html.
  - user can store html generated from external CSM system or design tool such as figma.
  - pikachu will just return the list of contents that store html under this contentType.
- Section type: a part of a Page. users will be asked to configure followings.
  - schema: define JSON schema for all contents under this contentType.
  - defaultValues: an example with given schema for explanation.
  - code: define react component that accept list of contents and return JSX.

Also rankingType should be configured to decide how to rank contents under placement.

#### RankingType

- Limit: how many contents should be returned.
- Strategy
  - random: default
  - latest:
  - bandit:
    - use contextual bandits exploiting user feedback.
  - external:
    - let external system to rank top N then merge ranked result with filtered result.

RankingType can be used to experiment on different algorithms to decide what is the best strategy by comparing multiple placements.

Placement is the place that connect customer dataset to your contents to provide experiments.

After creating a placement, you can create campaign/adGroup/creative hierachy to design/manage experiments. It is possible to test multiple content variantions with a customer segment, but also a content can be tested with multiple customer segments. The relation between segment and content is M:N.

### 6. Analyze results and automate campaigns

Once you've created an experiment, you can use the dashboard to monitor its performance and analyze the results. The default implementation use posthog-js as client event collecting SDK, HTTP rest event server that proxy SDK events into Kafka, then persist kafka messages into AWS S3, then finally ETL jobs that calculate impression/click per creative. It's possible to use different pipeline to build result view of statistics on creatives. This result will be used by API server to apply ranking contents.

## Contributing

We welcome contributions to Pikachu! To contribute, please fork the repository and submit a pull request.

## License

Pikachu is licensed under the Apache License 2.0 License.
