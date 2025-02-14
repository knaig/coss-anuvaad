FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu20.04

# System setup
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Kolkata
RUN apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/3bf863cc.pub && \
    apt-get update && \
    apt-get install -y \
        python3.8 \
        python3-pip \
        curl \
        build-essential \
        pkg-config \
        libssl-dev \
        tzdata \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup target add x86_64-unknown-linux-gnu

# Application setup
WORKDIR /app
RUN echo "[DEBUG] Current directory: $(pwd)" && ls -la && echo "--------"

# Copy local files
COPY server/requirements.txt .
COPY server/torch-1.9.0+cpu-cp38-cp38-linux_x86_64.whl .
RUN echo "[DEBUG] After COPY:" && ls -l && echo "--------"

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/pip \
    pip3 install \
    torch-1.9.0+cpu-cp38-cp38-linux_x86_64.whl \
    -f https://download.pytorch.org/whl/cpu/torch_stable.html \
    -r requirements.txt \
    --timeout=1000 \
    --retries=5

# Copy source code
COPY src/ /app/src/

# Final setup
WORKDIR /app/src
ENV PYTHONPATH="/app/src"
RUN python3 resources/fetch_models.py --config configs/fetch_models.json

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]