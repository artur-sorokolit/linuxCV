import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config/env';

const app = express();

app.use(
  cors({
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
