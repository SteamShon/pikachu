# stage 1 - generate a recipe file for dependencies 
FROM rust as planner 

WORKDIR /app
RUN cargo install cargo-chef
COPY . .
RUN cargo chef prepare --recipe-path recipe.json --bin event

# stage 2 - build our dependencies
FROM rust as cacher

# librdkafka 
RUN apt-get update && apt-get install -y gcc \
    cmake \
    build-essential \
    curl \
    openssl libssl-dev \
    pkg-config \
    python \
    valgrind \
    zlib1g \
    zlib1g-dev \
    libzstd-dev 
RUN git clone https://github.com/edenhill/librdkafka.git /root/librdkafka
WORKDIR /root/librdkafka
RUN ./configure --prefix /usr --install-deps && make && make install
# RUN make clean && rm -rf librdkafka

WORKDIR /app
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# stage 3 - use the main officiall rust docker image as our builder
FROM rust as builder

ENV USER=event
ENV UID=1002

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
RUN cargo build --release --bin event

# use google distroless as runtime image
FROM gcr.io/distroless/cc-debian11
    
# import from builder.
COPY --from=builder /etc/passwd /etc/passwd 
COPY --from=builder /etc/group /etc/group

# copy app from builder 
COPY --from=builder /app/target/release/event /app/event
COPY --from=builder /lib/x86_64-linux-gnu/libz.so.1 /lib/x86_64-linux-gnu/libz.so.1
WORKDIR /app 

USER event:event

# start the application 
CMD ["./event"]
