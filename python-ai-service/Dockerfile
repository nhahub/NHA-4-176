FROM python:3.11-slim
WORKDIR /app/python-ai-service

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install (long timeout for large PyTorch CUDA wheel ~500MB)
COPY requirements.txt ./
RUN pip install --no-cache-dir --timeout=1000 --retries=5 -r requirements.txt

# Copy the application source code
COPY . .

# Expose port
EXPOSE 8000

# Run uvicorn server
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
