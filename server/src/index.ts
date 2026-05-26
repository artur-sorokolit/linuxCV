import app from './app';
import { config } from './config/env';
import { getDb } from './db';

async function bootstrap() {
  try {
    await getDb();

    app.listen(config.port, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
      console.log(`Environment: ${config.env}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
