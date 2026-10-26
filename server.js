require('dotenv').config();
const { createApp } = require('./src/app');
const db = require('./src/db');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  try {
    console.log('[SERVER] Initializing database...');
    await db.initDb();
    console.log('[SERVER] Database initialized successfully.');

    const app = createApp();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] Express server running at http://0.0.0.0:${PORT}`);
      console.log(`[SERVER] Ready for QA testing on branch phase-1-foundation-auth.`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await db.closeDb();
        console.log('[SERVER] Closed HTTP server and database pool.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return server;
  } catch (err) {
    console.error('[SERVER] Failed to start server:', err);
    process.exit(1);
  }
}

// If executed directly, run the server
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
