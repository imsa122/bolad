# Real Estate Platform - MySQL Setup Guide

This guide will help you set up and connect your Next.js Real Estate Platform to a MySQL database.

## Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ installed and running on port 3307
- MySQL database named `real_estate_db` created
- MySQL user with appropriate permissions

## Database Connection

The application is configured to connect to a MySQL database with the following details:

- **Host**: localhost
- **Port**: 3307
- **Database**: real_estate_db
- **Username**: root
- **Password**: 113245Aa!

## Setup Instructions

### 1. Install Dependencies

```bash
cd real-estate-platform
npm install
```

### 2. Configure Environment Variables

The `.env` file is already set up with the MySQL connection string:

```
DATABASE_URL="mysql://root:113245Aa!@localhost:3307/real_estate_db"
```

If you need to modify the connection details, update this line accordingly.

### 3. Test MySQL Connection

Run the connection test script to verify that your MySQL server is accessible:

```bash
node test-mysql-connection.mjs
```

This will check if the MySQL server is running and if the database exists.

### 4. Set Up the Database

Run the database setup script to initialize the database schema and seed data:

```bash
node setup-mysql-db.mjs
```

This script will:
- Test the MySQL connection
- Generate the Prisma client
- Run database migrations
- Seed the database with initial data
- Verify the setup

### 5. Manual Setup (Alternative)

If you prefer to run the commands manually:

```bash
# Generate Prisma client
npx prisma generate

# Create database migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed
```

### 6. Verify API Connection

Start the Next.js development server:

```bash
npm run dev
```

Then visit the test API endpoint to verify the database connection:

```
http://localhost:3000/api/test-db
```

You should see a JSON response with database information.

## Database Schema

The database schema includes the following models:

- **Users**: User accounts with role-based access
- **Properties**: Real estate listings with multilingual support
- **Bookings**: Property booking records
- **Contacts**: Contact form submissions

## Admin Access

After seeding the database, you can log in with the admin account:

- **Email**: admin@realestate.sa
- **Password**: Admin@123456

## Prisma Studio

You can use Prisma Studio to view and edit your database:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can browse and manage your data.

## Troubleshooting

### Migration Provider Switch Error

If you encounter this error:

```
Error: P3019
The datasource provider `mysql` specified in your schema does not match the one specified in the migration_lock.toml, `sqlite`.
```

Run the `reset-migrations.bat` file from Command Prompt (not PowerShell):

1. Open Command Prompt
2. Navigate to the project directory
3. Run: `reset-migrations.bat`

This will remove the existing migrations and create a new migration history for MySQL.

### Other MySQL Connection Issues

If you encounter other issues with the MySQL connection:

1. Ensure MySQL is running on port 3307
2. Verify the username and password in the `.env` file
3. Make sure the `real_estate_db` database exists
4. Check that the MySQL user has appropriate permissions
5. If using a different port, update the `DATABASE_URL` in `.env`

For database-specific errors, check the MySQL error logs.

## Production Deployment

For production deployment:

1. Set up a production MySQL database
2. Update the `DATABASE_URL` in your production environment
3. Run `npx prisma migrate deploy` to apply migrations
4. Ensure your database has proper backups and security measures

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Next.js Documentation](https://nextjs.org/docs)
