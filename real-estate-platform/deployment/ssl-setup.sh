#!/bin/bash
# ============================================
# SSL Setup with Let's Encrypt
# Run after setup.sh and DNS is configured
# Usage: sudo bash ssl-setup.sh yourdomain.com admin@yourdomain.com
# ============================================

set -e

DOMAIN=${1:-"realestate.sa"}
EMAIL=${2:-"admin@realestate.sa"}

echo "Setting up SSL for domain: $DOMAIN"
echo "Email: $EMAIL"

# Obtain SSL certificate
certbot --nginx \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --redirect

# Test auto-renewal
certbot renew --dry-run

# Setup auto-renewal cron job
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -

echo "✅ SSL configured successfully for $DOMAIN"
echo "✅ Auto-renewal cron job added"
