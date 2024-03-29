'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import session from 'express-session';
import mongo from './db/mongo';
import routes from './routes';
import config from './config';
import Redis from './db/redis';
import employee from './controllers/employee';
import log from './util/logger';
import Control from './util/control';

const app = express();

(async () => {
  try {
    config.connect();
    const redis = Redis();

    app.use(helmet());
    app.disable('x-powered-by');
    app.set('trust proxy', 1); // trust first proxy
    app.use(session(config.sessionOptions()));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    await mongo();
    if (!redis.connected) throw new Error('Redis not connected');
    await employee.refreshRedis();

    routes(app);

    const server = app.listen(config.port, () => {
      log.info(`Server is running on port ${config.port}, process ${config.env()}`);
    });

    new Control(server); // eslint-disable-line
  } catch (e) {
    log.error(e);
    // Deal with the fact the chain failed
  }
})();
