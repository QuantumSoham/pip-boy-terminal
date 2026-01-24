FROM ubuntu:22.04

LABEL maintainer="Robert House"
LABEL description="Vault-Tec RobCo Dev Environment (Java, Python, Node)"

ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# -------------------------------------------------
# Base system, build tools, networking utilities
# -------------------------------------------------
RUN apt-get update && apt-get install -y \
    sudo \
    curl \
    wget \
    git \
    vim \
    nano \
    unzip \
    zip \
    ca-certificates \
    gnupg \
    software-properties-common \
    build-essential \
    iproute2 \
    net-tools \
    iputils-ping \
    dnsutils \
    procps \
    lsof \
    && rm -rf /var/lib/apt/lists/*

# -------------------------------------------------
# Java (OpenJDK 17)
# -------------------------------------------------
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

# -------------------------------------------------
# Python
# -------------------------------------------------
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir \
    virtualenv \
    ipython \
    black \
    flake8

# -------------------------------------------------
# Node.js (LTS)
# -------------------------------------------------
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# -------------------------------------------------
# Non-root dev user
# -------------------------------------------------
RUN useradd -ms /bin/bash dev && \
    echo "dev ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER dev
WORKDIR /home/dev

# -------------------------------------------------
# Minimal RobCo shell
# -------------------------------------------------
RUN echo 'export PS1="\\u@\\h:\\w$ "' >> ~/.bashrc

CMD ["bash"]
