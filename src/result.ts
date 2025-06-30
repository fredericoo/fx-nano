export class UnhandledError extends Error {
	originalError: unknown;
	constructor(originalError: unknown) {
		super('Unhandled error');
		this.originalError = originalError;
		this.name = 'UnhandledError';
	}
}

type Success<R> = readonly [null, R];
type Failure<E> = readonly [E, null];
export type Result<E, R> = Success<R> | Failure<E>;
export type ResultAsync<E, R> = Promise<Result<E, Awaited<R>>>;
type ResultMaybeAsync<E, R> = Result<E, R> | ResultAsync<E, R>;

type SuperResult<E, R> = Generator<Result<E, R>, R, any>;
type SuperResultAsync<E, R> = Generator<Result<E, R>, R, any>;

export function fn<A extends any[], const E, const R>(
	fn: (...args: A) => Result<E, R>,
): (...args: A) => SuperResult<E, R>;
export function fn<A extends any[], const E, const R>(
	fn: (...args: A) => ResultAsync<E, R>,
): (...args: A) => SuperResultAsync<E, R>;
export function fn<A extends any[], const E, const R>(fn: (...args: A) => ResultMaybeAsync<E, R>) {
	const wrappedFn = (...args: A) => {
		const result = fn(...args);

		// Create a generator function that yields the result
		const generator = function* (): Generator<ResultMaybeAsync<E, R>, ResultMaybeAsync<E, R>, any> {
			if (result instanceof Promise) {
				return yield result;
			}
			return yield result;
		};

		// Make the function callable both ways:
		// 1. As a regular function (returns the result directly)
		// 2. As a generator (via yield* or [Symbol.iterator])
		const returnFn = () => result;

		// Add generator capabilities
		returnFn[Symbol.iterator] = generator;

		return returnFn;
	};

	return wrappedFn as any;
}

/** Runs a function in a safe context. If the function throws, it will return a failure result.
 * @example
 * const result = run(() => {
 *   if (Math.random() > 0.5) {
 *     return err("Completely random error");
 *   }
 *   return ok(1);
 * });
 *
 * console.log(result); // Result<"Completely random error" | UnhandledError, 1>
 *
 * const result2 = run(() => {
 *   throw new Error('Error');
 * });
 *
 * console.log(result2); // [UnhandledError, null]
 */
export const run = <const E, const R>(fn: (...args: any) => Result<E, R>): Result<E | UnhandledError, R> => {
	try {
		return fn();
	} catch (error) {
		return err(new UnhandledError(error));
	}
};

/** Runs an asynchronous function in a safe context. If the function throws, it will return a failure result.
 * @example
 * const promiseToRun = fn(async ()=>ok(true));
 * const result = await runPromise(promiseToRun());
 *
 * console.log(result); // Result<UnhandledError, true>
 */
export const runPromise = async <const E, const R>(promise: ResultAsync<E, R>): ResultAsync<E | UnhandledError, R> => {
	try {
		return await promise;
	} catch (error) {
		return Promise.resolve(err(new UnhandledError(error)));
	}
};

/** Marks a successful result.
 * @example
 * const result = ok(1);
 *
 * console.log(result); // [null, 1]
 */
export const ok = <const R>(success: R): Success<R> => [null, success];

/** Marks a failure result.
 * @example
 * const result = err("API error");
 *
 * console.log(result); // ["API error", null]
 */
export const err = <const E>(error: E): Failure<E> => [error, null];
