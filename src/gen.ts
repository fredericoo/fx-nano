import { type Result, UnhandledError, err, ok } from './result';

function gen<TResult, TYield>(
	f: () => Generator<TYield, TResult, any>,
): Result<TYield extends Result<infer E, any> ? E | UnhandledError : UnhandledError, TResult> {
	const generator = f();
	let current = generator.next();

	while (!current.done) {
		const yielded = current.value;

		// Check if it's a result tuple [error, value] or [null, value]
		if (!Array.isArray(yielded) || yielded.length !== 2) {
			return err(new UnhandledError(new Error('Yielded value must be a Result tuple [error, value]'))) as any;
		}

		const [error, value] = yielded as [any, any];

		// If there's an error, abort and return the error state
		if (error !== null) {
			return [error, null] as any;
		}

		// Continue with the success value - pass it back to the generator
		current = generator.next(value);
	}

	// Return the final result as success
	return ok(current.value) as any;
}

export { gen };
