import type { ErrorRequestHandler, Express, Request, Response } from 'express';
import express from 'express';
import pinoHttp from 'pino-http';

import { isTest } from './config/env.js';
import { logger } from './logger/logger.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { healthRouter } from './routes/health.routes.js';


export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (!isTest) {
    app.use(pinoHttp({ logger }));
  }

  app.use(requestLogger);

  app.use(healthRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal Server Error' });
  };
  app.use(errorHandler);

  return app;
}
