import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/test-db
 * 
 * Test API route to verify MySQL database connection
 * Returns database status and basic information
 */
export async function GET() {
  try {
    // Test database connection with a simple query
    const testQuery = await prisma.$queryRaw`SELECT 1+1 AS result`;
    
    // Get MySQL version
    const versionResult = await prisma.$queryRaw<Array<{version: string}>>`SELECT VERSION() AS version`;
    const mysqlVersion = versionResult[0].version;
    
    // Get table counts
    const usersCount = await prisma.user.count();
    const propertiesCount = await prisma.property.count();
    const bookingsCount = await prisma.booking.count();
    const contactsCount = await prisma.contact.count();
    
    // Get database tables
    const tablesResult = await prisma.$queryRaw<Array<Record<string, string>>>`SHOW TABLES`;
    const tables = tablesResult.map((table) => Object.values(table)[0]);
    
    return NextResponse.json({
      success: true,
      message: 'MySQL database connection successful',
      data: {
        mysqlVersion,
        tables,
        counts: {
          users: usersCount,
          properties: propertiesCount,
          bookings: bookingsCount,
          contacts: contactsCount,
        },
        connectionInfo: {
          provider: 'mysql',
          host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]?.split(':')[0] || 'localhost',
          database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'real_estate_db',
        }
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to MySQL database',
        details: error instanceof Error ? error.message : String(error),
        troubleshooting: [
          'Check if MySQL server is running on port 3307',
          'Verify username and password in .env file',
          'Make sure the database "real_estate_db" exists',
          'Check if Prisma migrations have been applied',
          'Ensure MySQL user has proper permissions'
        ]
      },
      { status: 500 }
    );
  }
}
