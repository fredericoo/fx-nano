import { type Result, fx } from './result';

function gen<TResult, TYield>(
	f: () => Generator<TYield, TResult, any>,
): Result<TYield extends Result<infer E, any> ? E : never, TResult> {
	const generator = f();
	let current = generator.next();

	while (!current.done) {
		const yielded = current.value;

		// Check if it's a result tuple [error, value] or [null, value]
		if (!Array.isArray(yielded) || yielded.length !== 2) {
			throw new Error('Yielded value must be a Result tuple [error, value]');
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
	return fx.ok(current.value) as any;
}

const doStuff = fx.fn(() => {
	if (Math.random() > 0.5) {
		return fx.ok('success in doStuff');
	}
	return fx.err('error in doStuff');
});

export const res = gen(function* () {
	const a = yield* doStuff();

	return a;
});

export { gen };
