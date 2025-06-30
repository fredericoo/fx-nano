import { type Result, fx } from './result';

declare function gen<TResult, TYield>(
	f: () => Generator<TYield, TResult, never>,
): Result<TYield extends Result<infer E, any> ? E : never, TResult>;

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
