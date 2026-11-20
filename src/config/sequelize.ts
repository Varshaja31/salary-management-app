import { Sequelize, Options } from 'sequelize';

import logger from '../logger/logger.js';
import { env, isTest } from './env.js';


const sequelizeOptions: Options = {
  dialect: env.DB_DIALECT,
  logging: env.DB_LOGGING ? (msg) => logger.info(msg) : false,
  ...(isTest ? {} : {}),
};

  sequelizeOptions.storage = env.DB_STORAGE;

export const sequelize = new Sequelize(
  sequelizeOptions,
);
