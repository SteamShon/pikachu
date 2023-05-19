## Getting started

### Development 
```sh
cargo run --bin api
```

### Start with Docker

```sh
cd ../
docker compose up api
```

### Deploy to fly.io
```sh
flyctl deploy --dockerfile=event/Dockerfile --config=event.fly.toml
```