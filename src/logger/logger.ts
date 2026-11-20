import type { Logger as PinoLogger } from 'pino';
import pino from 'pino';

import { env, isProduction } from '../config/env.js';


const pinoLogger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    env: env.NODE_ENV,
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname,service,version,env',
          },
        },
      }),
});


export const logger: PinoLogger & { log: PinoLogger['info'] } = new Proxy(pinoLogger, {
  get(target, prop: string) {
    if (prop === 'log') {
      return target.info.bind(target);
    }
    return (target as unknown as Record<string, unknown>)[prop];
  },
}) as PinoLogger & { log: PinoLogger['info'] };

export type Logger = typeof logger;
export default logger;
