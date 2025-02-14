#FROM anuvaadio/anuvaad-etl-aligner:147-b34bdfb0
#FROM nvidia/cuda:10.2-base
# CMD nvidia-smi
# RUN apt update && apt install python3-pip -y
# ENV LC_ALL en_US.UTF-8
# ENV LANG en_US.UTF-8
# ENV LANGUAGE en_US.UTF-8
FROM python:3.8-slim-buster
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust with specific toolchain
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup target add x86_64-unknown-linux-gnu

COPY requirements.txt .
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY controller/ controller/
COPY embedder/ embedder/
COPY laser/ laser/
COPY validator/ validator/
COPY app.py .
COPY utilities/ utilities/

COPY ./start.sh /usr/bin/start.sh
RUN chmod +x /usr/bin/start.sh
CMD ["python3", "app.py"]
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:5000/health || exit 1

