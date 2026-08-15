import app from './app';
import { config } from './config/env';
import { getDb, closeDb } from './db';
import { startLogRetention } from './services/logRetention';

const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT'] as const;

async function bootstrap() {
  try {
    await getDb();
    const stopRetention = startLogRetention(config.chatLogRetentionDays);

    const server = app.listen(config.port, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
      console.log(`Environment: ${config.env}`);
    });

    server.on('error', (error) => {
      console.error('❌ HTTP server error:', error);
      process.exit(1);
    });

    SHUTDOWN_SIGNALS.forEach((signal) =>
      process.once(signal, () => {
        console.log(`${signal} received, shutting down`);
        stopRetention();
        server.close(() => {
          closeDb().finally(() => process.exit(0));
        });
      })
    );
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
