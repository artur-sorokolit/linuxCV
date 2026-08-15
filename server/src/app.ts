import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiters';
import { config } from './config/env';
import { getDb } from './db';
import { VISITOR_HEADER } from './utils/visitorToken';

const MAX_BODY_SIZE = '32kb';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
    allowedHeaders: ['Content-Type', VISITOR_HEADER],
  })
);
app.use(express.json({ limit: MAX_BODY_SIZE }));

app.get('/health', async (_req, res) => {
  try {
    const db = await getDb();
    await db.get('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api', apiLimiter, apiRoutes);

app.use(errorHandler);

export default app;
