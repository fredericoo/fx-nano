import { describe, expect, test } from 'vitest';
import { gen } from './gen';
import { fx } from './result';

describe('gen function', () => {
	test('should handle successful generator with single yield', () => {
		const result = gen(function* () {
			const value = yield fx.ok('test value');
			return value;
		});

		expect(result).toEqual([null, 'test value']);
	});

	test('should handle error result and abort generator', () => {
		const result = gen(function* () {
			const value = yield fx.err('test error');
			return `This should not be reached: ${value}`;
		});

		expect(result).toEqual(['test error', null]);
	});

	test('should handle multiple successful yields', () => {
		const result = gen(function* () {
			const first = yield fx.ok('first');
			const second = yield fx.ok('second');
			return `${first}-${second}`;
		});

		expect(result).toEqual([null, 'first-second']);
	});

	test('should abort on first error in multiple yields', () => {
		const result = gen(function* () {
			const first = yield fx.ok('first');
			const second = yield fx.err('second error');
			const third = yield fx.ok('third');
			return `${first}-${second}-${third}`;
		});

		expect(result).toEqual(['second error', null]);
	});

	test('should handle generator with no yields', () => {
		const result = gen(function* () {
			// This generator intentionally has no yields to test that case
			// @ts-ignore
			return 'direct return';
		});

		expect(result).toEqual([null, 'direct return']);
	});

	test('should throw error for non-result tuple yields', () => {
		expect(() => {
			gen(function* () {
				yield 'not a result tuple';
				return 'test';
			});
		}).toThrow('Yielded value must be a Result tuple [error, value]');
	});

	test('should throw error for invalid array yields', () => {
		expect(() => {
			gen(function* () {
				yield [1, 2, 3]; // Wrong length
				return 'test';
			});
		}).toThrow('Yielded value must be a Result tuple [error, value]');
	});

	test('should handle complex nested logic', () => {
		const result = gen(function* () {
			const a = yield fx.ok(5);
			const b = yield fx.ok(10);

			if (a + b > 10) {
				const extra = yield fx.ok('bonus');
				return `Sum: ${a + b}, ${extra}`;
			}

			return `Sum: ${a + b}`;
		});

		expect(result).toEqual([null, 'Sum: 15, bonus']);
	});
});
