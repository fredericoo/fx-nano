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
type Result<E, R> = Success<R> | Failure<E>;
export type ResultAsync<E, R> = Promise<Result<E, Awaited<R>>>;
type ResultMaybeAsync<E, R> = Result<E, R> | ResultAsync<E, R>;

function fn<A extends any[], const E, const R>(fn: (...args: A) => Result<E, R>): (...args: A) => Result<E, R>;
function fn<A extends any[], const E, const R>(
	fn: (...args: A) => ResultAsync<E, R>,
): (...args: A) => ResultAsync<E, R>;
function fn<A extends any[], const E, const R>(fn: (...args: A) => ResultMaybeAsync<E, R>) {
	return fn;
}

export const fg = {
	fn,
	/** Runs a function in a safe context. If the function throws, it will return a failure result.
	 * @example
	 * const result = fx.run(() => {
	 *   if (Math.random() > 0.5) {
	 *     return fx.err("Completely random error");
	 *   }
	 *   return fx.ok(1);
	 * });
	 *
	 * console.log(result); // Result<"Completely random error" | UnhandledError, 1>
	 *
	 * const result2 = fx.run(() => {
	 *   throw new Error('Error');
	 * });
	 *
	 * console.log(result2); // [UnhandledError, null]
	 */
	run: <const E, const R>(fn: (...args: any) => Result<E, R>): Result<E | UnhandledError, R> => {
		try {
			return fn();
		} catch (error) {
			return fg.err(new UnhandledError(error));
		}
	},
	/** Runs an asynchronous function in a safe context. If the function throws, it will return a failure result.
	 * @example
	 * const promiseToRun = fx.fn(async ()=>fx.ok(true));
	 * const result = await fx.runPromise(promiseToRun());
	 *
	 * console.log(result); // Result<UnhandledError, true>
	 */
	runPromise: async <const E, const R>(promise: ResultAsync<E, R>): ResultAsync<E | UnhandledError, R> => {
		try {
			return await promise;
		} catch (error) {
			return Promise.resolve(fg.err(new UnhandledError(error)));
		}
	},
	/** Marks a successful result.
	 * @example
	 * const result = fx.ok(1);
	 *
	 * console.log(result); // [null, 1]
	 */
	ok: <const R>(success: R): Success<R> => [null, success],
	/** Marks a failure result.
	 * @example
	 * const result = fx.err("API error");
	 *
	 * console.log(result); // ["API error", null]
	 */
	err: <const E>(error: E): Failure<E> => [error, null],
};
