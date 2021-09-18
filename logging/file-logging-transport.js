import { Writable } from 'node:stream';
export default options => {
    const myTransportStream = new Writable({
        write(chunk, _, cb) {
            console.log(chunk.toString());
            cb();
        },
    });
    return myTransportStream;
};
//# sourceMappingURL=file-logging-transport.js.map