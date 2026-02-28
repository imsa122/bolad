import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { execSync } from 'child_process';

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
const envPath = resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    acc[key] = value;
  }
  return acc;
}, {});

// Set environment variables
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// Test server URL
const API_URL = 'http://localhost:3000/api';
let serverProcess;
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Helper function to log test results
function logTest(name, passed, error = null) {
  testResults.total++;
  
  if (passed === null) {
    testResults.skipped++;
    console.log(`${colors.yellow}⚠️ SKIPPED: ${name}${colors.reset}`);
    return;
  }
  
  if (passed) {
    testResults.passed++;
    console.log(`${colors.green}✅ PASSED: ${name}${colors.reset}`);
  } else {
    testResults.failed++;
    console.log(`${colors.red}❌ FAILED: ${name}${colors.reset}`);
    if (error) {
      console.log(`${colors.dim}   Error: ${error}${colors.reset}`);
    }
  }
}

// Helper function to start the Next.js server
async function startServer() {
  console.log(`\n${colors.cyan}Starting Next.js server...${colors.reset}`);
  
  try {
    // Check if server is already running
    try {
      const response = await fetch(`${API_URL}/test-db`);
      if (response.ok) {
        console.log(`${colors.green}Server is already running.${colors.reset}`);
        return true;
      }
    } catch (e) {
      // Server is not running, continue to start it
    }
    
    // Start the server in a separate process
    console.log(`${colors.yellow}Starting new server instance...${colors.reset}`);
    serverProcess = execSync('node start-dev.mjs', { 
      cwd: __dirname,
      stdio: 'inherit',
      detached: true 
    });
    
    // Wait for server to start
    console.log(`${colors.yellow}Waiting for server to start...${colors.reset}`);
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${API_URL}/test-db`);
        if (response.ok) {
          console.log(`${colors.green}Server started successfully.${colors.reset}`);
          return true;
        }
      } catch (e) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`${colors.yellow}Still waiting for server... (${attempts}/${maxAttempts})${colors.reset}`);
      }
    }
    
    console.log(`${colors.red}Server failed to start after ${maxAttempts} attempts.${colors.reset}`);
    return false;
  } catch (error) {
    console.error(`${colors.red}Error starting server: ${error.message}${colors.reset}`);
    return false;
  }
}

// Helper function to stop the server
function stopServer() {
  if (serverProcess) {
    console.log(`\n${colors.cyan}Stopping server...${colors.reset}`);
    try {
      process.kill(-serverProcess.pid);
    } catch (e) {
      // Ignore errors when stopping server
    }
  }
}

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log(`\n${colors.bright}${colors.blue}🔍 Testing Database Connection${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}`);
  
  try {
    // Test raw query
    try {
      const result = await prisma.$queryRaw`SELECT 1+1 AS result`;
      logTest('Raw SQL query', result[0].result === 2);
    } catch (error) {
      logTest('Raw SQL query', false, error.message);
    }
    
    // Test database version
    try {
      const versionResult = await prisma.$queryRaw`SELECT VERSION() AS version`;
      const version = versionResult[0].version;
      logTest('MySQL version', version && version.includes('.'), `Version: ${version}`);
    } catch (error) {
      logTest('MySQL version', false, error.message);
    }
    
    // Test connection to all tables
    try {
      const usersCount = await prisma.user.count();
      logTest('Users table connection', usersCount !== undefined);
    } catch (error) {
      logTest('Users table connection', false, error.message);
    }
    
    try {
      const propertiesCount = await prisma.property.count();
      logTest('Properties table connection', propertiesCount !== undefined);
    } catch (error) {
      logTest('Properties table connection', false, error.message);
    }
    
    try {
      const bookingsCount = await prisma.booking.count();
      logTest('Bookings table connection', bookingsCount !== undefined);
    } catch (error) {
      logTest('Bookings table connection', false, error.message);
    }
    
    try {
      const contactsCount = await prisma.contact.count();
      logTest('Contacts table connection', contactsCount !== undefined);
    } catch (error) {
      logTest('Contacts table connection', false, error.message);
    }
  } catch (error) {
    console.error(`${colors.red}Error testing database connection: ${error.message}${colors.reset}`);
  }
}

// Test CRUD operations
async function testCRUDOperations() {
  console.log(`\n${colors.bright}${colors.blue}🔄 Testing CRUD Operations${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}`);
  
  // Test User CRUD
  try {
    // Create user
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'hashed_password_here',
        role: 'USER',
      },
    });
    
    logTest('Create user', testUser && testUser.id > 0);
    
    // Read user
    const foundUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    
    logTest('Read user', foundUser && foundUser.id === testUser.id);
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { name: 'Updated Test User' },
    });
    
    logTest('Update user', updatedUser && updatedUser.name === 'Updated Test User');
    
    // Delete user
    const deletedUser = await prisma.user.delete({
      where: { id: testUser.id },
    });
    
    logTest('Delete user', deletedUser && deletedUser.id === testUser.id);
  } catch (error) {
    console.error(`${colors.red}Error testing User CRUD: ${error.message}${colors.reset}`);
    logTest('User CRUD operations', false, error.message);
  }
  
  // Test Property CRUD
  try {
    // Create property
    const testProperty = await prisma.property.create({
      data: {
        title_ar: 'عقار اختبار',
        title_en: 'Test Property',
        description_ar: 'وصف عقار الاختبار',
        description_en: 'Test property description',
        price: 1000000,
        city: 'Test City',
        type: 'SALE',
        status: 'AVAILABLE',
        bedrooms: 3,
        bathrooms: 2,
        area: 200,
        images: JSON.stringify(['test-image.jpg']),
        amenities: JSON.stringify(['Test Amenity']),
      },
    });
    
    logTest('Create property', testProperty && testProperty.id > 0);
    
    // Read property
    const foundProperty = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });
    
    logTest('Read property', foundProperty && foundProperty.id === testProperty.id);
    
    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id: testProperty.id },
      data: { price: 1100000 },
    });
    
    logTest('Update property', updatedProperty && updatedProperty.price.toString() === '1100000');
    
    // Delete property
    const deletedProperty = await prisma.property.delete({
      where: { id: testProperty.id },
    });
    
    logTest('Delete property', deletedProperty && deletedProperty.id === testProperty.id);
  } catch (error) {
    console.error(`${colors.red}Error testing Property CRUD: ${error.message}${colors.reset}`);
    logTest('Property CRUD operations', false, error.message);
  }
  
  // Test relations (User -> Booking -> Property)
  try {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Relation Test User',
        email: `relation-test-${Date.now()}@example.com`,
        password: 'hashed_password_here',
        role: 'USER',
      },
    });
    
    // Create test property
    const testProperty = await prisma.property.create({
      data: {
        title_ar: 'عقار اختبار العلاقات',
        title_en: 'Relation Test Property',
        description_ar: 'وصف عقار اختبار العلاقات',
        description_en: 'Relation test property description',
        price: 2000000,
        city: 'Relation Test City',
        type: 'RENT',
        status: 'AVAILABLE',
        bedrooms: 2,
        bathrooms: 1,
        area: 150,
        images: JSON.stringify(['relation-test-image.jpg']),
        amenities: JSON.stringify(['Relation Test Amenity']),
      },
    });
    
    // Create booking with relations
    const testBooking = await prisma.booking.create({
      data: {
        propertyId: testProperty.id,
        userId: testUser.id,
        bookingType: 'VISIT',
        status: 'PENDING',
        message: 'Test booking message',
        visitDate: new Date(),
      },
    });
    
    logTest('Create related booking', testBooking && testBooking.id > 0);
    
    // Test fetching booking with relations
    const bookingWithRelations = await prisma.booking.findUnique({
      where: { id: testBooking.id },
      include: {
        user: true,
        property: true,
      },
    });
    
    logTest(
      'Fetch booking with relations',
      bookingWithRelations &&
      bookingWithRelations.user.id === testUser.id &&
      bookingWithRelations.property.id === testProperty.id
    );
    
    // Clean up test data
    await prisma.booking.delete({ where: { id: testBooking.id } });
    await prisma.property.delete({ where: { id: testProperty.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    logTest('Clean up relation test data', true);
  } catch (error) {
    console.error(`${colors.red}Error testing relations: ${error.message}${colors.reset}`);
    logTest('Relation operations', false, error.message);
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log(`\n${colors.bright}${colors.blue}🌐 Testing API Endpoints${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}`);
  
  // Test database connection endpoint
  try {
    const { status, data } = await apiRequest('/test-db');
    logTest('GET /api/test-db', status === 200 && data.success === true);
  } catch (error) {
    logTest('GET /api/test-db', false, error.message);
  }
  
  // Test authentication endpoints
  let authToken = null;
  let testUserId = null;
  
  // Test user registration
  try {
    const testEmail = `api-test-${Date.now()}@example.com`;
    const { status, data } = await apiRequest('/auth/register', 'POST', {
      name: 'API Test User',
      email: testEmail,
      password: 'Test@123456',
      confirmPassword: 'Test@123456',
    });
    
    testUserId = data.data?.user?.id;
    logTest('POST /api/auth/register', status === 201 && data.success === true && testUserId);
  } catch (error) {
    logTest('POST /api/auth/register', false, error.message);
  }
  
  // Test user login
  try {
    const testEmail = `api-test-${Date.now()}@example.com`;
    
    // Create a test user first
    await prisma.user.create({
      data: {
        name: 'API Login Test User',
        email: testEmail,
        password: '$2a$12$k8Y1Vn9/kyAG4rCh.5/O3.1z6Jl.3EGQ9KzNFMm0FNnB4ZhLWRW4e', // Test@123456
        role: 'USER',
      },
    });
    
    const { status, data } = await apiRequest('/auth/login', 'POST', {
      email: testEmail,
      password: 'Test@123456',
    });
    
    authToken = data.data?.token;
    logTest('POST /api/auth/login', status === 200 && data.success === true && authToken);
  } catch (error) {
    logTest('POST /api/auth/login', false, error.message);
  }
  
  // Test properties endpoints
  let testPropertyId = null;
  
  // Test get properties
  try {
    const { status, data } = await apiRequest('/properties');
    logTest('GET /api/properties', status === 200 && Array.isArray(data.data));
  } catch (error) {
    logTest('GET /api/properties', false, error.message);
  }
  
  // Test create property (requires auth)
  if (authToken) {
    try {
      const { status, data } = await apiRequest('/properties', 'POST', {
        title_ar: 'عقار اختبار API',
        title_en: 'API Test Property',
        description_ar: 'وصف عقار اختبار API',
        description_en: 'API test property description',
        price: 3000000,
        city: 'API Test City',
        type: 'SALE',
        bedrooms: 4,
        bathrooms: 3,
        area: 300,
      }, authToken);
      
      testPropertyId = data.data?.id;
      logTest('POST /api/properties', status === 201 && data.success === true && testPropertyId);
    } catch (error) {
      logTest('POST /api/properties', false, error.message);
    }
    
    // Test get property by ID
    if (testPropertyId) {
      try {
        const { status, data } = await apiRequest(`/properties/${testPropertyId}`);
        logTest('GET /api/properties/:id', status === 200 && data.data?.id === testPropertyId);
      } catch (error) {
        logTest('GET /api/properties/:id', false, error.message);
      }
      
      // Test update property
      try {
        const { status, data } = await apiRequest(`/properties/${testPropertyId}`, 'PUT', {
          price: 3500000,
        }, authToken);
        
        logTest('PUT /api/properties/:id', status === 200 && data.success === true);
      } catch (error) {
        logTest('PUT /api/properties/:id', false, error.message);
      }
      
      // Test delete property
      try {
        const { status, data } = await apiRequest(`/properties/${testPropertyId}`, 'DELETE', null, authToken);
        logTest('DELETE /api/properties/:id', status === 200 && data.success === true);
      } catch (error) {
        logTest('DELETE /api/properties/:id', false, error.message);
      }
    } else {
      logTest('GET /api/properties/:id', null);
      logTest('PUT /api/properties/:id', null);
      logTest('DELETE /api/properties/:id', null);
    }
  } else {
    logTest('POST /api/properties', null);
    logTest('GET /api/properties/:id', null);
    logTest('PUT /api/properties/:id', null);
    logTest('DELETE /api/properties/:id', null);
  }
  
  // Clean up test user if created
  if (testUserId) {
    try {
      await prisma.user.delete({ where: { id: testUserId } });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Test error handling
async function testErrorHandling() {
  console.log(`\n${colors.bright}${colors.blue}🛡️ Testing Error Handling${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}`);
  
  // Test invalid database queries
  try {
    try {
      await prisma.$queryRaw`SELECT * FROM non_existent_table`;
      logTest('Invalid table query', false, 'Should have thrown an error');
    } catch (error) {
      logTest('Invalid table query', error.message.includes('non_existent_table'));
    }
    
    try {
      await prisma.user.findUnique({ where: { non_existent_field: 'value' } });
      logTest('Invalid field query', false, 'Should have thrown an error');
    } catch (error) {
      logTest('Invalid field query', error.message.includes('non_existent_field'));
    }
  } catch (error) {
    console.error(`${colors.red}Error testing invalid queries: ${error.message}${colors.reset}`);
  }
  
  // Test API error handling
  try {
    // Test non-existent endpoint
    const { status, data } = await apiRequest('/non-existent-endpoint');
    logTest('Non-existent API endpoint', status === 404);
  } catch (error) {
    logTest('Non-existent API endpoint', false, error.message);
  }
  
  // Test invalid property ID
  try {
    const { status, data } = await apiRequest('/properties/99999999');
    logTest('Invalid property ID', status === 404 && data.success === false);
  } catch (error) {
    logTest('Invalid property ID', false, error.message);
  }
  
  // Test unauthorized access
  try {
    const { status, data } = await apiRequest('/auth/me');
    logTest('Unauthorized access', status === 401 && data.success === false);
  } catch (error) {
    logTest('Unauthorized access', false, error.message);
  }
  
  // Test validation errors
  try {
    const { status, data } = await apiRequest('/auth/register', 'POST', {
      // Missing required fields
      email: 'invalid-email',
    });
    
    logTest('Validation errors', status === 400 && data.success === false);
  } catch (error) {
    logTest('Validation errors', false, error.message);
  }
}

// Test edge cases
async function testEdgeCases() {
  console.log(`\n${colors.bright}${colors.blue}🔍 Testing Edge Cases${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}`);
  
  // Test very long text fields
  try {
    const longText = 'A'.repeat(10000);
    const testProperty = await prisma.property.create({
      data: {
        title_ar: 'عقار اختبار طويل',
        title_en: 'Long Text Test Property',
        description_ar: longText,
        description_en: longText,
        price: 1000000,
        city: 'Test City',
        type: 'SALE',
        status: 'AVAILABLE',
        bedrooms: 3,
        bathrooms: 2,
        area: 200,
        images: JSON.stringify(['test-image.jpg']),
        amenities: JSON.stringify(['Test Amenity']),
      },
    });
    
    const foundProperty = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });
    
    logTest('Very long text fields', 
      foundProperty && 
      foundProperty.description_ar.length === longText.length &&
      foundProperty.description_en.length === longText.length
    );
    
    // Clean up
    await prisma.property.delete({ where: { id: testProperty.id } });
  } catch (error) {
    logTest('Very long text fields', false, error.message);
  }
  
  // Test special characters in text fields
  try {
    const specialChars = '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`';
    const arabicText = 'نص عربي مع رموز خاصة ' + specialChars;
    
    const testProperty = await prisma.property.create({
      data: {
        title_ar: arabicText,
        title_en: 'Special Chars ' + specialChars,
        description_ar: arabicText + arabicText,
        description_en: 'Description with special chars ' + specialChars,
        price: 1000000,
        city: 'Test City ' + specialChars,
        type: 'SALE',
        status: 'AVAILABLE',
        bedrooms: 3,
        bathrooms: 2,
        area: 200,
        images: JSON.stringify(['test-image.jpg']),
        amenities: JSON.stringify(['Test Amenity']),
      },
    });
    
    const foundProperty = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });
    
    logTest('Special characters in text fields', 
      foundProperty && 
      foundProperty.title_ar === arabicText &&
      foundProperty.title_en === 'Special Chars ' + specialChars
    );
    
    // Clean up
    await prisma.property.delete({ where: { id: testProperty.id } });
  } catch (error) {
    logTest('Special characters in text fields', false, error.message);
  }
  
  // Test very large numbers
  try {
    const testProperty = await prisma.property.create({
      data: {
        title_ar: 'عقار اختبار أرقام كبيرة',
        title_en: 'Large Numbers Test Property',
        description_ar: 'وصف عقار اختبار',
        description_en: 'Test property description',
        price: 999999999.99, // Very large price
        city: 'Test City',
        type: 'SALE',
        status: 'AVAILABLE',
        bedrooms: 100, // Large number of bedrooms
        bathrooms: 100, // Large number of bathrooms
        area: 9999999.99, // Very large area
        images: JSON.stringify(['test-image.jpg']),
        amenities: JSON.stringify(['Test Amenity']),
      },
    });
    
    const foundProperty = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });
    
    logTest('Very large numbers', 
      foundProperty && 
      foundProperty.price.toString() === '999999999.99' &&
      foundProperty.bedrooms === 100 &&
      foundProperty.area.toString() === '9999999.99'
    );
    
    // Clean up
    await prisma.property.delete({ where: { id: testProperty.id } });
  } catch (error) {
    logTest('Very large numbers', false, error.message);
  }
  
  // Test JSON fields with complex data
  try {
    const complexJson = {
      mainImage: 'main.jpg',
      gallery: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      sizes: {
        thumbnail: { width: 100, height: 100 },
        medium: { width: 500, height: 300 },
        large: { width: 1200, height: 800 }
      },
      tags: ['luxury', 'modern', 'new'],
      metadata: {
        photographer: 'John Doe',
        copyright: '© 2023',
        location: {
          lat: 24.7136,
          lng: 46.6753
        }
      }
    };
    
    const testProperty = await prisma.property.create({
      data: {
        title_ar: 'عقار اختبار JSON',
        title_en: 'JSON Test Property',
        description_ar: 'وصف عقار اختبار',
        description_en: 'Test property description',
        price: 1000000,
        city: 'Test City',
        type: 'SALE',
        status: 'AVAILABLE',
        bedrooms: 3,
        bathrooms: 2,
        area: 200,
        images: complexJson,
        amenities: JSON.stringify(['Test Amenity']),
      },
    });
    
    const foundProperty = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });
    
    // Parse the JSON from the database
    const parsedImages = typeof foundProperty.images === 'string' 
      ? JSON.parse(foundProperty.images) 
      : foundProperty.images;
    
    logTest('Complex JSON fields', 
      foundProperty && 
      parsedImages.mainImage === complexJson.mainImage &&
      parsedImages.gallery.length === complexJson.gallery.length &&
      parsedImages.sizes.large.width === complexJson.sizes.large.width
    );
    
    // Clean up
    await prisma.property.delete({ where: { id: testProperty.id } });
  } catch (error) {
    logTest('Complex JSON fields', false, error.message);
  }
}

// Main test function
async function runTests() {
  console.log(`\n${colors.bright}${colors.magenta}🚀 Starting Thorough MySQL Database Tests${colors.reset}`);
  console.log(`${colors.cyan}==================================================${colors.reset}`);
  
  try {
    // Start the server for API tests
    const serverStarted = await startServer();
    
    // Test database connection
    await testDatabaseConnection();
    
    // Test CRUD operations
    await testCRUDOperations();
    
    // Test API endpoints if server started
    if (serverStarted) {
      await testAPIEndpoints();
    } else {
      console.log(`${colors.yellow}⚠️ Skipping API tests as server could not be started${colors.reset}`);
    }
    
    // Test error handling
    await testErrorHandling();
    
    // Test edge cases
    await testEdgeCases();
    
    // Print test summary
    console.log(`\n${colors.bright}${colors.blue}📊 Test Summary${colors.reset}`);
    console.log(`${colors.cyan}==================================${colors.reset}`);
    console.log(`${colors.bright}Total tests:   ${testResults.total}${colors.reset}`);
    console.log(`${colors.green}Passed:        ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed:        ${testResults.failed}${colors.reset}`);
    console.log(`${colors.yellow}Skipped:       ${testResults.skipped}${colors.reset}`);
    
    const passRate = Math.round((testResults.passed / (testResults.total - testResults.skipped)) * 100);
    console.log(`${colors.bright}Pass rate:     ${passRate}%${colors.reset}`);
    
    if (testResults.failed === 0) {
      console.log(`\n${colors.bright}${colors.green}✅ All tests passed successfully!${colors.reset}`);
    } else {
      console.log(`\n${colors.bright}${colors.yellow}⚠️ Some tests failed. Review the results above.${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}${colors.magenta}MySQL Database Setup and Testing Complete${colors.reset}`);
    console.log(`${colors.cyan}==================================================${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
  } finally {
    // Stop the server if it was started
    stopServer();
    
    // Disconnect from the database
    await prisma.$disconnect();
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});
