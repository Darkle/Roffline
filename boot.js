import dotenv from './node_modules/dotenv/lib/main.js';
dotenv.config();
import { cleanEnv as envVarChecker, str, port } from 'envalid';
import { startServer } from './server/server.js';
envVarChecker(process.env, {
    PORT: port({ default: 8080 }),
    PUBLIC_FOLDER: str({ default: './frontend-build' }),
    LOGDIR: str({ default: './roffline-logs' }),
    POSTS_MEDIA_DOWNLOAD_DIR: str({ default: './posts-media' }),
    DBPATH: str({ default: './roffline-storage.db' }),
    NODE_ENV: str({ choices: ['development', 'test', 'testing', 'production'] }),
});
startServer().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=boot.js.map