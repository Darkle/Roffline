import Pino from '../node_modules/pino/pino.js';
import { getEnvFilePath } from '../server/utils.js';
const pinoOptions = {
    name: 'roffline',
    level: process.env['LOGGING_LEVEL'],
    base: undefined,
};
const transports = Pino.transport({
    targets: [
        {
            level: process.env['LOGGING_LEVEL'],
            target: 'pino-pretty',
            options: { destination: 1 },
        },
        {
            level: process.env['LOGGING_LEVEL'],
            target: './file-logging-transport.js',
            options: { outDir: getEnvFilePath(process.env['LOGDIR']) },
        },
    ],
});
const mainLogger = Pino(pinoOptions, transports);
mainLogger.debug('hello');
mainLogger.error(new Error('this is an error'));
const feedsLogger = mainLogger.child({ sublogger: 'feeds' });
const mediaDownloadsLogger = mainLogger.child({ sublogger: 'media-downloads' });
const dbLogger = mainLogger.child({ sublogger: 'db' });
export { mainLogger, feedsLogger, mediaDownloadsLogger, dbLogger };
//# sourceMappingURL=logging.js.map