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

export const fx = {
	/** Runs a function in a safe context. If the function throws, it will return a failure result.
	 * @example
	 * const result = fx.run(() => {
	 *   if (Math.random() > 0.5) {
	 *     return fx.fail("Completely random error");
	 *   }
	 *   return fx.ok(1);
	 * });
	 *
	 * console.log(result); // [undefined, 1] | ["Completely random error" | UnhandledError, null]
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
			return fx.fail(new UnhandledError(error));
		}
	},
	/** Runs an asynchronous function in a safe context. If the function throws, it will return a failure result.
	 * @example
	 * const result = fx.runPromise(async () => {
	 *   const data = await fetch('https://api.example.com/data');
	 *   if (data.status !== 200) return fx.fail("API error");
	 *   return fx.ok(data.json() as Promise<{ id: number; name: string }>);
	 * });
	 *
	 * console.log(await result); // [null, { id: number; name: string }] | ["API error" | UnhandledError, null]
	 */
	runPromise: async <const E, const R>(promise: ResultAsync<E, R>): ResultAsync<E | UnhandledError, R> => {
		try {
			return await promise;
		} catch (error) {
			return Promise.resolve(fx.fail(new UnhandledError(error)));
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
	 * const result = fx.fail("API error");
	 *
	 * console.log(result); // ["API error", null]
	 */
	fail: <const E>(error: E): Failure<E> => [error, null],
};
