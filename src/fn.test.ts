import { describe, expect, test } from 'vitest';
import { fx } from './fx';

describe('fn function', () => {
	test('should work outside of generator context (compatibility)', () => {
		const doStuff = fx.fn(() => {
			return fx.ok('success');
		});

		const generator = doStuff();
		const result = [...generator]; // Run the generator to completion
		expect(result).toEqual([[null, 'success']]);
	});

	test('should work with error outside of generator context', () => {
		const doStuff = fx.fn(() => {
			return fx.err('error');
		});

		const generator = doStuff();
		const result = [...generator]; // Run the generator to completion
		expect(result).toEqual([['error', null]]);
	});

	test('should work inside generator with yield*', () => {
		const doStuff = fx.fn(() => {
			return fx.ok('generator success');
		});

		const result = fx.gen(function* () {
			const a = yield* doStuff();
			return a;
		});

		expect(result).toEqual([null, 'generator success']);
	});

	test('should work with error inside generator with yield*', () => {
		const doStuff = fx.fn(() => {
			return fx.err('generator error');
		});

		const result = fx.gen(function* () {
			const a = yield* doStuff();
			return `This should not be reached: ${a}`;
		});

		expect(result).toEqual(['generator error', null]);
	});

	test('should work with conditional logic in generator', () => {
		const randomStuff = fx.fn(() => {
			if (Math.random() > 0.5) {
				return fx.ok('lucky');
			}
			return fx.err('unlucky');
		});

		// Test multiple times to ensure both paths work
		let successCount = 0;
		let errorCount = 0;

		for (let i = 0; i < 20; i++) {
			const result = fx.gen(function* () {
				const a = yield* randomStuff();
				return a;
			});

			if (result[0] === null) {
				expect(result[1]).toBe('lucky');
				successCount++;
			} else {
				expect(result[0]).toBe('unlucky');
				expect(result[1]).toBe(null);
				errorCount++;
			}
		}

		// At least one of each should have occurred in 20 tries (very likely)
		expect(successCount + errorCount).toBe(20);
	});

	test('should work with function parameters', () => {
		const addNumbers = fx.fn((a: number, b: number) => {
			if (a < 0 || b < 0) {
				return fx.err('Negative numbers not allowed');
			}
			return fx.ok(a + b);
		});

		// Test outside generator
		const directResult = addNumbers(5, 3);
		const directResultArray = [...directResult];
		expect(directResultArray).toEqual([[null, 8]]);

		const directError = addNumbers(-1, 3);
		const directErrorArray = [...directError];
		expect(directErrorArray).toEqual([['Negative numbers not allowed', null]]);

		// Test inside generator
		const genResult = fx.gen(function* () {
			const sum = yield* addNumbers(10, 20);
			return sum * 2;
		});
		expect(genResult).toEqual([null, 60]);

		const genError = fx.gen(function* () {
			const sum = yield* addNumbers(-5, 10);
			return sum * 2;
		});
		expect(genError).toEqual(['Negative numbers not allowed', null]);
	});
});
