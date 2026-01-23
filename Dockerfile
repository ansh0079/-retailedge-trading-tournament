# Dockerfile for AI Trading Tournament
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements-tournament.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements-tournament.txt

# Copy application files
COPY deepseek_python_20260119_ac400a.py .
COPY *.txt . 2>/dev/null || true

# Create directories for data persistence
RUN mkdir -p /app/data /app/logs /app/vector_memory

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DB_FILE=/app/data/ultimate_tournament.db
ENV LOG_FILE=/app/logs/ultimate_tournament.log
ENV VECTOR_DB_PATH=/app/vector_memory

# Volume mounts for persistence
VOLUME ["/app/data", "/app/logs", "/app/vector_memory"]

# Run the tournament
CMD ["python", "deepseek_python_20260119_ac400a.py"]
