import { cleanEnv as envVarChecker, str, port } from 'envalid';
import { startServer } from './server/server.js';
import { mainLogger } from './logging/logging.js';
envVarChecker(process.env, {
    PORT: port({ default: 8080 }),
    PUBLIC_FOLDER: str({ default: './frontend-build' }),
    LOGDIR: str({ default: './roffline-logs' }),
    POSTS_MEDIA_DOWNLOAD_DIR: str({ default: './posts-media' }),
    DBPATH: str({ default: './roffline-storage.db' }),
    NODE_ENV: str({ choices: ['development', 'test', 'testing', 'production'] }),
    LOGGING_LEVEL: str({ choices: ['debug', 'error'], default: 'error' }),
});
function bailOnFatalError(err) {
    console.error(err);
    try {
    }
    catch (error) {
    }
    finally {
        try {
            mainLogger.fatal(err);
        }
        catch (error) {
        }
        finally {
            process.exit(1);
        }
    }
}
process.on('unhandledRejection', bailOnFatalError);
process.on('uncaughtException', bailOnFatalError);
startServer().catch(err => {
    console.error(err);
    mainLogger.fatal(err);
    process.exit(1);
});
//# sourceMappingURL=boot.js.map