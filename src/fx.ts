import { gen } from './gen';
import { type Result, type ResultAsync, err, fn, ok, run, runPromise } from './result';
export { UnhandledError } from './result';

export type { Result, ResultAsync };
export const fx = { fn, ok, err, run, runPromise, gen };
