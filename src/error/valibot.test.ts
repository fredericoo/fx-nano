import { email, minLength, number, object, parse, pipe, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { makeSifter } from '.';
import { staticErr } from './generic';
import { handleValiError } from './valibot';

describe('valibotErr', () => {
	test('should return undefined for non-ValiError instances', () => {
		const adapter = handleValiError();

		expect(adapter(new Error('Regular error'))).toBeUndefined();
		expect(adapter('string error')).toBeUndefined();
		expect(adapter({ message: 'object error' })).toBeUndefined();
		expect(adapter(null)).toBeUndefined();
		expect(adapter(undefined)).toBeUndefined();
	});

	test('should handle ValiError with root issues', () => {
		const schema = pipe(string(), minLength(5, 'String too short'));

		try {
			parse(schema, 'abc');
		} catch (error) {
			const adapter = handleValiError();
			const result = adapter(error);

			expect(result).toBeDefined();
			expect(result?.root).toEqual(['String too short']);
			expect(result?.form).toEqual({});
		}
	});

	test('should handle ValiError with nested form issues', () => {
		const schema = object({
			name: pipe(string(), minLength(2, 'Name too short')),
			email: pipe(string(), email('Invalid email format')),
			age: number('Age must be a number'),
		});

		try {
			parse(schema, {
				name: 'a',
				email: 'invalid-email',
				age: 'not-a-number',
			});
		} catch (error) {
			const adapter = handleValiError();
			const result = adapter(error);

			expect(result).toBeDefined();
			expect(result?.form).toBeDefined();

			// Check that form errors are properly structured
			const form = result?.form || {};
			expect(Object.keys(form).length).toBeGreaterThan(0);
		}
	});

	test('should handle ValiError with mixed root and nested issues', () => {
		const complexSchema = object({
			username: pipe(string(), minLength(3, 'Username too short')),
			profile: object({
				email: pipe(string(), email('Invalid email')),
			}),
		});

		try {
			parse(complexSchema, {
				username: 'ab',
				profile: {
					email: 'bad-email',
				},
			});
		} catch (error) {
			const adapter = handleValiError();
			const result = adapter(error);

			expect(result).toBeDefined();
			expect(result?.root).toBeDefined();
			expect(result?.form).toBeDefined();
		}
	});

	test('should work correctly within makeStdErr adapter chain', () => {
		const sift = makeSifter(handleValiError(), staticErr('Fallback error'));

		// Test with ValiError
		const schema = pipe(string(), minLength(5, 'Too short'));
		try {
			parse(schema, 'abc');
		} catch (valibotError) {
			const result = sift(valibotError);
			expect(result.root).toEqual(['Too short']);
			expect(result.form).toEqual({});
		}

		// Test with non-ValiError (should fallback to hardcoded error)
		const result = sift(new Error('Regular error'));
		expect(result.root).toEqual(['Fallback error']);
		expect(result.form).toEqual({});
	});

	test('should handle empty ValiError issues', () => {
		// Create a minimal ValiError for testing edge cases
		const schema = string();

		try {
			parse(schema, 123); // This will create a ValiError
		} catch (error) {
			const adapter = handleValiError();
			const result = adapter(error);

			expect(result).toBeDefined();
			expect(result?.root).toBeDefined();
			expect(result?.form).toBeDefined();
		}
	});

	test('should preserve error adapter chain behavior', () => {
		const sift = makeSifter(handleValiError(), staticErr('Fallback message'));

		// Test that valibot errors are handled first
		const schema = pipe(string(), minLength(3, 'Valibot error message'));
		try {
			parse(schema, 'ab');
		} catch (valibotError) {
			const result = sift(valibotError);
			expect(result.root).toContain('Valibot error message');
		}

		// Test that non-valibot errors fall through to hardcoded
		const regularErrorResult = sift(new Error('Regular error'));
		expect(regularErrorResult.root).toEqual(['Fallback message']);
	});
});
