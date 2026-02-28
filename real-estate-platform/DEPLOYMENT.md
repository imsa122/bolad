# 🚀 Deployment Guide — Saudi Real Estate Platform

## Prerequisites
- Ubuntu 22.04 LTS VPS (minimum 2 vCPU, 4GB RAM, 40GB SSD)
- Domain name pointed to your VPS IP
- SSH access to the server

---

## 📋 Phase 1: Local Development Setup

### 1. Clone & Install
```bash
cd real-estate-platform
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your values
nano .env
```

### 3. Database Setup (Local MySQL)
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE real_estate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🖥️ Phase 2: VPS Production Deployment

### Step 1: Initial Server Setup
```bash
# SSH into your VPS
ssh ubuntu@YOUR_VPS_IP

# Upload and run setup script
scp deployment/setup.sh ubuntu@YOUR_VPS_IP:~/
sudo bash setup.sh
```

### Step 2: Upload Project
```bash
# Option A: Git clone (recommended)
cd /var/www/real-estate-platform
git clone https://github.com/YOUR_USERNAME/real-estate-platform.git .

# Option B: SCP upload
scp -r ./real-estate-platform ubuntu@YOUR_VPS_IP:/var/www/
```

### Step 3: Configure Environment
```bash
cd /var/www/real-estate-platform
cp .env.example .env
nano .env

# Required values to set:
# DATABASE_URL="mysql://realestate_user:DbPass@2024!@localhost:3306/real_estate_db"
# JWT_SECRET=<generate with: openssl rand -base64 64>
# JWT_REFRESH_SECRET=<generate with: openssl rand -base64 64>
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 4: Install & Build
```bash
cd /var/www/real-estate-platform
npm install --production=false
npx prisma generate
npx prisma migrate deploy
npm run db:seed   # Optional: seed with sample data
npm run build
```

### Step 5: Start with PM2
```bash
cp deployment/ecosystem.config.js .
# Edit ecosystem.config.js - update cwd path if needed
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 6: Configure Nginx
```bash
# Copy nginx config
sudo cp deployment/nginx.conf /etc/nginx/sites-available/realestate
# Edit domain name
sudo nano /etc/nginx/sites-available/realestate
# Replace 'realestate.sa' with your actual domain

sudo ln -sf /etc/nginx/sites-available/realestate /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: SSL Certificate
```bash
sudo bash deployment/ssl-setup.sh yourdomain.com admin@yourdomain.com
```

---

## 🔧 Phase 3: Maintenance Commands

### PM2 Management
```bash
pm2 status                          # Check app status
pm2 logs real-estate-platform       # View logs
pm2 restart real-estate-platform    # Restart app
pm2 reload real-estate-platform     # Zero-downtime reload
pm2 stop real-estate-platform       # Stop app
pm2 monit                           # Monitor dashboard
```

### Database Management
```bash
# Run migrations
npx prisma migrate deploy

# Open Prisma Studio (local only)
npx prisma studio

# Backup database
mysqldump -u realestate_user -p real_estate_db > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u realestate_user -p real_estate_db < backup_20240101.sql
```

### Update Deployment
```bash
cd /var/www/real-estate-platform
git pull origin main
npm install
npx prisma migrate deploy
npm run build
pm2 reload ecosystem.config.js --env production
```

---

## 🔒 Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate strong JWT secrets: `openssl rand -base64 64`
- [ ] Set `NODE_ENV=production`
- [ ] Configure firewall (UFW) — only ports 22, 80, 443
- [ ] Enable fail2ban for SSH protection
- [ ] Set up automated database backups
- [ ] Configure log rotation
- [ ] Enable MySQL binary logging for point-in-time recovery
- [ ] Set up monitoring (e.g., UptimeRobot, Datadog)

---

## 📊 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@localhost:3306/db` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `openssl rand -base64 64` |
| `JWT_EXPIRES_IN` | JWT token expiry | `7d` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://realestate.sa` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIza...` |
| `UPLOAD_DIR` | File upload directory | `./public/uploads` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

---

## 🏗️ Architecture Overview

```
Internet
    │
    ▼
[Nginx :443] ──SSL──► [Let's Encrypt]
    │
    ▼
[Next.js :3000] (PM2 Cluster)
    │
    ├──► [MySQL :3306]
    │
    └──► [/public/uploads] (Static files)
```

---

## 📁 Project Structure

```
real-estate-platform/
├── prisma/
│   ├── schema.prisma          # Database models
│   └── seed.ts                # Sample data
├── src/
│   ├── app/
│   │   ├── [locale]/          # i18n pages (ar/en)
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── properties/    # Property listing & details
│   │   │   ├── admin/         # Admin dashboard
│   │   │   ├── auth/          # Login & Register
│   │   │   ├── booking/       # Booking confirmation
│   │   │   └── contact/       # Contact page
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/          # Authentication
│   │   │   ├── properties/    # Property CRUD
│   │   │   ├── bookings/      # Booking management
│   │   │   ├── contact/       # Contact form
│   │   │   ├── upload/        # File upload
│   │   │   └── admin/stats/   # Admin statistics
│   │   ├── sitemap.ts         # Dynamic sitemap
│   │   └── robots.ts          # Robots.txt
│   ├── components/
│   │   ├── layout/            # Navbar, Footer
│   │   ├── properties/        # PropertyCard, FilterBar, BookingForm
│   │   ├── maps/              # PropertyMap (Leaflet)
│   │   └── admin/             # AdminSidebar, PropertyForm
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── jwt.ts             # JWT utilities
│   │   ├── auth.ts            # Auth helpers
│   │   ├── validations.ts     # Zod schemas
│   │   ├── rate-limit.ts      # Rate limiting
│   │   └── utils.ts           # Utility functions
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth state hook
│   │   └── useProperties.ts   # Properties data hook
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── i18n.ts                # next-intl config
│   ├── middleware.ts           # Route protection + i18n
│   └── globals.css            # Global styles
├── messages/
│   ├── ar.json                # Arabic translations
│   └── en.json                # English translations
├── deployment/
│   ├── nginx.conf             # Nginx configuration
│   ├── ecosystem.config.js    # PM2 configuration
│   ├── setup.sh               # VPS setup script
│   └── ssl-setup.sh           # SSL configuration
├── public/
│   ├── uploads/               # User uploaded images
│   └── images/                # Static images
├── .env.example               # Environment template
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login user |
| POST | `/api/auth/logout` | Auth | Logout user |
| GET | `/api/auth/me` | Auth | Get current user |
| GET | `/api/properties` | Public | List properties (filtered) |
| POST | `/api/properties` | Admin | Create property |
| GET | `/api/properties/:id` | Public | Get property details |
| PUT | `/api/properties/:id` | Admin | Update property |
| DELETE | `/api/properties/:id` | Admin | Delete property |
| GET | `/api/bookings` | Auth | List bookings |
| POST | `/api/bookings` | Auth | Create booking |
| PATCH | `/api/bookings/:id` | Admin | Update booking status |
| POST | `/api/contact` | Public | Submit contact form |
| POST | `/api/upload` | Admin | Upload images |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |

---

## 🔑 Default Credentials (Change in Production!)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@realestate.sa | Admin@123456 |
| User | user@realestate.sa | User@123456 |
