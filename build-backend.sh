#!/bin/bash
set -e  # Exit immediately if any command fails
set -o pipefail  # Capture pipeline failures

# Clean command
clean() {
    echo -e "\033[1;34mCleaning Docker artifacts and models...\033[0m"
    docker-compose -f ./docker-compose.yml down --rmi all
    docker system prune -a -f --volumes
    rm -rf models/
    echo -e "\033[1;32m✓ Clean completed\033[0m"
    exit 0
}

# Argument handling
case "$1" in
    clean)
        clean
        ;;
    "")
        # Continue normal build
        ;;
    *)
        echo "Usage: $0 [clean]"
        exit 1
        ;;
esac

# Add before starting builds
echo -e "\033[1;34mVerifying Docker storage...\033[0m"
docker system df || {
    echo -e "\033[1;31m✗ Docker storage corrupted!\033[0m"
    docker system prune -af
    exit 1
}

# Check if in Codespaces
if [ -n "${CODESPACES}" ]; then
  export DOCKER_HOST="tcp://localhost:2375"
  export KAFKA_HOST="localhost"
else
  export KAFKA_HOST="kafka"
fi

# Start infrastructure
echo -e "\033[1;34m[1/7] Starting infrastructure services...\033[0m"
docker-compose -f ./docker-compose.yml up -d mongodb redis zookeeper kafka elasticsearch

# Build workflow manager
echo -e "\n\033[1;34m[2/7] Building Workflow Manager...\033[0m"
echo "Current directory before workflow build: $(pwd)"
cd anuvaad-etl/anuvaad-workflow-mgr/etl-wf-manager

# Verify Dockerfile exists
[ -f "Dockerfile" ] || { echo "Missing Dockerfile in $(pwd)"; exit 1; }

# Build with proper context
docker buildx build -t workflow-manager:1.0 . \
    --cache-from=type=local,src=/tmp/anuvaad-cache \
    --cache-to=type=local,dest=/tmp/anuvaad-cache,mode=max \
    --load || {
        echo -e "\033[1;31m✗ Build failed - $(basename $(pwd))\033[0m"
        docker builder prune -af  # Clean failed build cache
        exit 1
    }
echo -e "\033[1;32m✓ Workflow Manager built successfully\033[0m"
cd ../../../
echo -e "\033[1;34mCurrent directory after workflow build: $(pwd)\033[0m"

# Build OCR service
echo -e "\n\033[1;34m[3/7] Building OCR Service...\033[0m"
echo "Current directory before OCR build: $(pwd)"
cd anuvaad-etl/anuvaad-extractor/document-processor/ocr/ocr-tesseract-server
echo "Attempting to build in: $(pwd)"
[ -f "Dockerfile" ] || { echo "Missing OCR Dockerfile in $(pwd)"; exit 1; }
docker buildx build -t anuvaad-ocr:2.1 -f Dockerfile . \
    --cache-from=type=local,src=/tmp/anuvaad-cache \
    --cache-to=type=local,dest=/tmp/anuvaad-cache,mode=max \
    --load || {
        echo -e "\033[1;31m✗ Build failed - $(basename $(pwd))\033[0m"
        docker builder prune -af  # Clean failed build cache
        exit 1
    }
echo -e "\033[1;32m✓ OCR Service built successfully\033[0m"
cd ../../../../../
echo -e "\033[1;34mCurrent directory after OCR build: $(pwd)\033[0m"

# Build NMT service
echo -e "\n\033[1;34m[4/7] Building NMT Service using Dockerfile at $(pwd)/anuvaad-nmt-inference/server/Dockerfile\033[0m"
echo "Current directory before NMT build: $(pwd)"
if [ -f "anuvaad-nmt-inference/server/requirements.txt" ]; then
  sed -i '' 's/cu111/cpu/g' anuvaad-nmt-inference/server/requirements.txt
fi

export DOCKER_BUILDKIT=1  # Explicitly enable
docker buildx build -t nmt-inference-cpu \
  -f anuvaad-nmt-inference/server/Dockerfile \
  anuvaad-nmt-inference/ \
  --platform=linux/amd64 \
  --cache-from=type=local,src=/tmp/anuvaad-cache \
  --cache-to=type=local,dest=/tmp/anuvaad-cache,mode=max \
  --shm-size 2g \
  --cpuset-cpus 0-3 \
  --load || {
      echo -e "\033[1;31m✗ Build failed - $(basename $(pwd))\033[0m"
      docker builder prune -af  # Clean failed build cache
      exit 1
  }

# Verify build success
# Removed redundant check - the || clause already handles exit

# Build aligner
echo -e "\n\033[1;34m[5/7] Building Aligner Service...\033[0m"
echo "Current directory before aligner build: $(pwd)"
cd anuvaad-etl/anuvaad-extractor/aligner/etl-aligner || { echo "Aligner directory missing!"; exit 1; }
docker buildx build -t aligner-service:1.0 \
    -f Dockerfile \
    . \
    --platform=linux/amd64 \
    --no-cache \
    --load || {
        echo -e "\033[1;31m✗ Build failed - $(basename $(pwd))\033[0m"
        exit 1
    }
echo -e "\033[1;32m✓ Aligner Service built successfully\033[0m"
cd ../../../../../ || { echo "Failed to return to root directory"; exit 1; }
echo -e "\033[1;34mCurrent directory after aligner build: $(pwd)\033[0m"

# Start services only if all builds succeed
if [ $? -eq 0 ]; then
  echo -e "\n\033[1;34m[6/7] Starting all services...\033[0m"
  docker-compose -f ./docker-compose.yml up -d \
    workflow-manager \
    anuvaad-ocr \
    nmt-inference-cpu \
    aligner-service
else
  echo -e "\033[1;31m✗ Aborting service start due to build failures\033[0m"
  exit 1
fi

# Verify services
echo -e "\n\033[1;34m[7/7] Verifying running services...\033[0m"
docker ps

# Final status
echo -e "\n\033[1;32m✅ Build completed! Used Dockerfiles:\033[0m"
echo "  - Workflow Manager: anuvaad-etl/anuvaad-workflow-mgr/etl-wf-manager/Dockerfile"
echo "  - OCR Service: anuvaad-etl/anuvaad-extractor/document-processor/ocr/ocr-tesseract_ulca/Dockerfile"
echo "  - NMT Service: anuvaad-nmt-inference/server/Dockerfile"
echo "  - Aligner: anuvaad-etl/anuvaad-extractor/aligner/etl-aligner/Dockerfile"

# Check NMT service logs
docker logs nmt-inference
# Look for CUDA availability

