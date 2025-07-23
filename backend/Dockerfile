# Use full Python 3.9 image (better compatibility with mediapipe)
FROM python:3.9

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system packages required by mediapipe, OpenCV, DeepFace, etc.
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    cmake \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy backend code into the container
COPY backend/ /app

# Upgrade pip and install Python build tools
RUN pip install --upgrade pip setuptools wheel

# ✅ Install mediapipe from official prebuilt wheel (avoids pip source build)
RUN pip install https://github.com/google/mediapipe/releases/download/v0.10.9/mediapipe-0.10.9-cp39-cp39-manylinux2014_x86_64.whl


# Expose port (Flask default)
EXPOSE 5000

# Run your Flask app
CMD ["python", "app.py"]