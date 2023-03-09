## Getting started

### Start with Docker

`sh
docker build -t pikachu/server .
docker run --env-file .env -p 8080:8080 -t pikachu/server
`
