import { PrismaClient } from '@prisma/client';
import { config } from './env';

const databaseUrl = config.database.url;

const getSanitizedDatabaseTarget = (rawUrl: string) => {
  if (!rawUrl) return 'missing DATABASE_URL';

  try {
    const parsed = new URL(rawUrl);
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port || 'default'}${parsed.pathname}`;
  } catch {
    return 'invalid DATABASE_URL';
  }
};

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

console.log(`Prisma target: ${getSanitizedDatabaseTarget(databaseUrl)}`);

prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received: closing database connection...`);
  try {
    await prisma.$disconnect();
    console.log('Database connection closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during database disconnection:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default prisma;
