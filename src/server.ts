import { createApp } from './app.js';
import { env, isTest } from './config/env.js';
import { logger } from './logger/logger.js';
import { initModels } from './models/index.js';

const app = createApp();

async function bootstrap(): Promise<void> {
  if (!isTest) {
    try {
      await initModels();
      logger.info('Database connected and models synced');
    } catch (err) {
      logger.error({ err }, 'Unable to connect to the database');
      throw err;
    }
  }

  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(`Server listening on http://${env.HOST}:${env.PORT}`);
  });

  function shutdown(signal: string): void {
    logger.info(`${signal} received, shutting down...`);
    server.close((err) => {
      if (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
      logger.info('Server closed');
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void bootstrap();
