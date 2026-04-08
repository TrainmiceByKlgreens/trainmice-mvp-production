import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Enhanced error handling for database connection
prisma.$connect().catch((error) => {
  console.error('❌ Failed to connect to database:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received: closing database connection...`);
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database disconnection:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, but log it
  if (process.env.NODE_ENV === 'production') {
    // Log to error tracking service in production
  }
});

export default prisma;

