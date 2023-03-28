# stage 1 - generate a recipe file for dependencies 
FROM rust as planner 
WORKDIR /app
RUN cargo install cargo-chef
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# stage 2 - build our dependencies
FROM rust as cacher
WORKDIR /app
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# stage 3 - use the main officiall rust docker image as our builder
FROM rust as builder

ENV USER=api
ENV UID=1001

# create user 
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}"

# copy the app into the dockr image 
COPY . /app

# set the work directory
WORKDIR /app

# copy dependencies 
COPY --from=cacher /app/target target
COPY --from=cacher /usr/local/cargo /usr/local/cargo

# build the app 
RUN cargo prisma generate && cargo build --release --bin api

# use google distroless as runtime image
FROM gcr.io/distroless/cc-debian11

# import from builder.
COPY --from=builder /etc/passwd /etc/passwd 
COPY --from=builder /etc/group /etc/group

# copy app from builder 
COPY --from=builder /app/target/release/api /app/api
WORKDIR /app 

USER api:api

# start the application 
CMD ["./api"]
