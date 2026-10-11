const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

let databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// On Vercel Serverless, file system is read-only except /tmp
if (process.env.VERCEL) {
  try {
    const tmpDbPath = '/tmp/dev.db';
    // Check multiple potential locations of bundled dev.db
    const potentialPaths = [
      path.join(__dirname, '../prisma/dev.db'),
      path.join(process.cwd(), 'server/prisma/dev.db'),
      path.join(process.cwd(), 'prisma/dev.db'),
    ];

    const sourceDb = potentialPaths.find((p) => fs.existsSync(p));

    if (!fs.existsSync(tmpDbPath) && sourceDb) {
      fs.copyFileSync(sourceDb, tmpDbPath);
      console.log('Seeded database copied to /tmp/dev.db for Vercel serverless writes.');
    }

    if (fs.existsSync(tmpDbPath)) {
      databaseUrl = `file:${tmpDbPath}`;
    }
  } catch (err) {
    console.error('Error configuring SQLite for Vercel:', err);
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

module.exports = prisma;
