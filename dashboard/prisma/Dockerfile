
FROM --platform=linux/amd64 node:16-alpine3.17 AS deps
RUN apk add --no-cache libc6-compat openssl1.1-compat
WORKDIR /app

# Install prisma for the migration
RUN npm install -g prisma --unsafe-perm

# Copy schema and migration folder
ADD ./ ./prisma/

CMD [ "prisma", "migrate", "deploy"]