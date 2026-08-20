#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Moja Buss — Enterprise Droplet Hardening & Setup Script (Ubuntu 22.04 / 24.04)
# ==============================================================================

if [ "$(id -u)" -ne 0 ]; then
  echo "Error: Please run this setup script as root (sudo ./setup-droplet.sh)" >&2
  exit 1
fi

echo "==> 1. Updating base packages..."
apt update && apt upgrade -y
apt install -y ufw fail2ban unattended-upgrades curl git htop jq net-tools

echo "==> 2. Setting up 4GB Swap Space (prevents OOM on high traffic)..."
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  echo "Swap setup complete."
else
  echo "Swap already exists."
fi

echo "==> 3. Configuring UFW Firewall (Deny incoming, allow SSH, HTTP, HTTPS only)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'Caddy HTTP'
ufw allow 443/tcp comment 'Caddy HTTPS'
# PostgreSQL (5432) remains closed to public internet (accessed via internal Docker network only)
ufw --force enable
ufw status verbose

echo "==> 4. Configuring Fail2ban (Brute-force protection)..."
systemctl enable fail2ban
systemctl restart fail2ban

echo "==> 5. Enabling Automatic Security Upgrades..."
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> 6. Ensuring Docker & Docker Compose V2 are installed..."
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

echo "==> 7. Configuring Docker Daemon JSON Log Rotation..."
mkdir -p /etc/docker
cat << 'EOF' > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

echo "=============================================================================="
echo "  Enterprise Droplet Hardening Complete!"
echo "  - UFW Active (Ports 22, 80, 443 open; DB 5432 closed to public)"
echo "  - 4GB Swapfile configured"
echo "  - Fail2ban protection active"
echo "  - Docker daemon log rotation active"
echo "=============================================================================="
