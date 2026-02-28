#!/bin/bash
# ============================================
# VPS Setup Script for Saudi Real Estate Platform
# Ubuntu 22.04 LTS
# Run as: sudo bash setup.sh
# ============================================

set -e  # Exit on any error

echo "============================================"
echo "  Saudi Real Estate Platform - VPS Setup"
echo "============================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ============================================
# 1. SYSTEM UPDATE
# ============================================
log "Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git unzip build-essential

# ============================================
# 2. NODE.JS 20 LTS
# ============================================
log "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version

# ============================================
# 3. PM2
# ============================================
log "Installing PM2..."
npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu
log "PM2 installed: $(pm2 --version)"

# ============================================
# 4. MYSQL 8.0
# ============================================
log "Installing MySQL 8.0..."
apt-get install -y mysql-server
systemctl start mysql
systemctl enable mysql

# Secure MySQL
log "Securing MySQL installation..."
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'RootPass@2024!';"
mysql -u root -pRootPass@2024! -e "DELETE FROM mysql.user WHERE User='';"
mysql -u root -pRootPass@2024! -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
mysql -u root -pRootPass@2024! -e "DROP DATABASE IF EXISTS test;"
mysql -u root -pRootPass@2024! -e "FLUSH PRIVILEGES;"

# Create database and user
log "Creating database and user..."
mysql -u root -pRootPass@2024! <<EOF
CREATE DATABASE IF NOT EXISTS real_estate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'realestate_user'@'localhost' IDENTIFIED BY 'DbPass@2024!';
GRANT ALL PRIVILEGES ON real_estate_db.* TO 'realestate_user'@'localhost';
FLUSH PRIVILEGES;
EOF
log "Database 'real_estate_db' created with user 'realestate_user'"

# ============================================
# 5. NGINX
# ============================================
log "Installing Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# ============================================
# 6. CERTBOT (Let's Encrypt)
# ============================================
log "Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx
log "Certbot installed. Run SSL setup separately."

# ============================================
# 7. FIREWALL
# ============================================
log "Configuring UFW firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw status

# ============================================
# 8. CREATE APP DIRECTORY
# ============================================
log "Creating application directory..."
mkdir -p /var/www/real-estate-platform
mkdir -p /var/log/pm2
chown -R ubuntu:ubuntu /var/www/real-estate-platform
chown -R ubuntu:ubuntu /var/log/pm2

# ============================================
# 9. NGINX CONFIGURATION
# ============================================
log "Configuring Nginx..."
cp /var/www/real-estate-platform/deployment/nginx.conf /etc/nginx/sites-available/realestate
ln -sf /etc/nginx/sites-available/realestate /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "============================================"
echo -e "${GREEN}  Setup Complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Upload your project to /var/www/real-estate-platform"
echo "  2. Copy .env.example to .env and fill in values"
echo "  3. Run: npm install"
echo "  4. Run: npx prisma migrate deploy"
echo "  5. Run: npm run build"
echo "  6. Run: pm2 start ecosystem.config.js --env production"
echo "  7. Run SSL setup: bash deployment/ssl-setup.sh"
echo ""
echo "Database credentials:"
echo "  Host: localhost"
echo "  Database: real_estate_db"
echo "  User: realestate_user"
echo "  Password: DbPass@2024!"
echo ""
warn "IMPORTANT: Change all default passwords before going live!"
