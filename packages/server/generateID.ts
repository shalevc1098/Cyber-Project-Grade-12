import * as snowflakey from 'snowflakey';

const Worker = new snowflakey.Worker({
    epoch: 1639992303789,
    incrementBits: 14,
    processBits: 0,
    workerBits: 8
});

export default function generateID(): number {
    return Worker.generate();
};