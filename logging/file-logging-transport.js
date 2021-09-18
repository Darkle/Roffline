import path from 'node:path';
import rotatingFileStream from '../node_modules/rotating-file-stream/index.js';
const maxFiles = 5;
export default (options) => {
    console.log(options);
    return rotatingFileStream.createStream(path.join(options.outDir, 'roffline.log'), {
        size: '5M',
        interval: '2d',
        maxFiles,
    });
};
//# sourceMappingURL=file-logging-transport.js.map