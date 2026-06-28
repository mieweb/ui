/** @module mutex */
/**
 * A mutex (mutual exclusion) lock.
 *
 * @class
 */
export class MutexLock {
    /**
     * Creates a new MutexLock.
     *
     * @constructor
     */
    constructor() {
        this.holder = Promise.resolve();
    }

    /**
     * Acquires the lock.
     *
     * @returns {Promise<Callable>} A promise that resolves when the lock is acquired.
     * Responds with a callable that releases the lock.
     */
    acquire() {
        let awaitResolve,
            temporaryPromise = new Promise((resolve) => {
                awaitResolve = () => resolve();
            }),
            returnValue = this.holder.then(() => awaitResolve);
        this.holder = temporaryPromise;
        return returnValue;
    }
}
