FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# System dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y \
        build-essential \
        curl \
        pkg-config \
        libssl-dev \
        python3-pip \
        python3-venv \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup target add x86_64-unknown-linux-gnu

# Python setup
RUN python3 -m pip install --upgrade pip