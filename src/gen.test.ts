import { describe, expect, test } from 'vitest';
import { UnhandledError, fx } from './fx';

describe('gen function', () => {
	test('should handle successful generator with single yield', () => {
		const result = fx.gen(function* () {
			const value = yield fx.ok('test value');
			return value;
		});

		expect(result).toEqual([null, 'test value']);
	});

	test('should handle error result and abort generator', () => {
		const result = fx.gen(function* () {
			const value = yield fx.err('test error');
			return `This should not be reached: ${value}`;
		});

		expect(result).toEqual(['test error', null]);
	});

	test('should handle multiple successful yields', () => {
		const result = fx.gen(function* () {
			const first = yield fx.ok('first');
			const second = yield fx.ok('second');
			return `${first}-${second}`;
		});

		expect(result).toEqual([null, 'first-second']);
	});

	test('should abort on first error in multiple yields', () => {
		const result = fx.gen(function* () {
			const first = yield fx.ok('first');
			const second = yield fx.err('second error');
			const third = yield fx.ok('third');
			return `${first}-${second}-${third}`;
		});

		expect(result).toEqual(['second error', null]);
	});

	test('should handle generator with no yields', () => {
		// biome-ignore lint/correctness/useYield: test case
		const result = fx.gen(function* () {
			// @ts-ignore
			// This generator intentionally has no yields to test that case
			return 'direct return';
		});

		expect(result).toEqual([null, 'direct return']);
	});

	test('should throw error for non-result tuple yields', () => {
		const [error] = fx.gen(function* () {
			yield 'not a result tuple';
			return 'test';
		});

		expect(error).toBeInstanceOf(UnhandledError);
		expect(error?.originalError).toBeInstanceOf(Error);
		expect((error?.originalError as Error)?.message).toBe('Yielded value must be a Result tuple [error, value]');
	});

	test('should throw error for invalid array yields', () => {
		const [error] = fx.gen(function* () {
			yield [1, 2, 3]; // Wrong length
			return 'test';
		});

		expect(error).toBeInstanceOf(UnhandledError);
		expect(error?.originalError).toBeInstanceOf(Error);
		expect((error?.originalError as Error)?.message).toBe('Yielded value must be a Result tuple [error, value]');
	});

	test('should handle complex nested logic', () => {
		const result = fx.gen(function* () {
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

describe('fx.fn integration with fx.gen', () => {
	test('should handle successful fx.fn functions', () => {
		const getUserData = fx.fn((id: number) => {
			if (id > 0) {
				return fx.ok({ id, name: `User${id}`, active: true });
			}
			return fx.err('Invalid user ID');
		});

		const getProfile = fx.fn((userId: number) => {
			return fx.ok({ userId, bio: 'Developer', posts: 42 });
		});

		const result = fx.gen(function* () {
			const user = yield* getUserData(123);
			const profile = yield* getProfile(user.id);

			return {
				user,
				profile,
				summary: `${user.name} has ${profile.posts} posts`,
			};
		});

		expect(result).toEqual([
			null,
			{
				user: { id: 123, name: 'User123', active: true },
				profile: { userId: 123, bio: 'Developer', posts: 42 },
				summary: 'User123 has 42 posts',
			},
		]);
	});

	test('should abort on first fx.fn error', () => {
		const getUserData = fx.fn((id: number) => {
			if (id > 0) {
				return fx.ok({ id, name: `User${id}` });
			}
			return fx.err('Invalid user ID');
		});

		const getProfile = fx.fn((userId: number) => {
			return fx.ok({ userId, bio: 'Developer' });
		});

		const result = fx.gen(function* () {
			const user = yield* getUserData(-1); // This will fail
			const profile = yield* getProfile(user.id); // This should not execute

			return { user, profile };
		});

		expect(result).toEqual(['Invalid user ID', null]);
	});

	test('should handle mixed fx.fn and direct yields', () => {
		const validateInput = fx.fn((input: string) => {
			if (input.length >= 3) {
				return fx.ok(input.toUpperCase());
			}
			return fx.err('Input too short');
		});

		const result = fx.gen(function* () {
			const validated = yield* validateInput('hello');
			const timestamp = yield fx.ok(Date.now());
			const processed = yield fx.ok(`${validated}_${timestamp}`);

			return {
				original: 'hello',
				processed,
				length: processed.length,
			};
		});

		expect(result[0]).toBe(null); // Success
		if (result[1]) {
			expect(result[1]).toMatchObject({
				original: 'hello',
				length: expect.any(Number),
			});
			expect(result[1].processed).toMatch(/^HELLO_\d+$/);
		}
	});

	test('should handle conditional fx.fn calls', () => {
		const checkAccess = fx.fn((level: number) => {
			if (level >= 10) {
				return fx.ok('admin');
			}
			if (level >= 5) {
				return fx.ok('user');
			}
			return fx.err('Access denied');
		});

		const performOperation = fx.fn((accessLevel: string) => {
			return fx.ok(`Operation completed for ${accessLevel}`);
		});

		// Test admin path
		const adminResult = fx.gen(function* () {
			const access = yield* checkAccess(15);
			const result = yield* performOperation(access);
			return result;
		});

		expect(adminResult).toEqual([null, 'Operation completed for admin']);

		// Test user path
		const userResult = fx.gen(function* () {
			const access = yield* checkAccess(7);
			const result = yield* performOperation(access);
			return result;
		});

		expect(userResult).toEqual([null, 'Operation completed for user']);

		// Test error path
		const errorResult = fx.gen(function* () {
			const access = yield* checkAccess(2);
			const result = yield* performOperation(access); // Should not execute
			return result;
		});

		expect(errorResult).toEqual(['Access denied', null]);
	});

	test('should handle chained fx.fn operations with error propagation', () => {
		const parseNumber = fx.fn((str: string) => {
			const num = Number.parseInt(str, 10);
			if (Number.isNaN(num)) {
				return fx.err(`Cannot parse "${str}" as number`);
			}
			return fx.ok(num);
		});

		const validatePositive = fx.fn((num: number) => {
			if (num <= 0) {
				return fx.err(`Number ${num} must be positive`);
			}
			return fx.ok(num);
		});

		const calculateSquare = fx.fn((num: number) => {
			return fx.ok(num * num);
		});

		// Test successful chain
		const successResult = fx.gen(function* () {
			const parsed = yield* parseNumber('5');
			const validated = yield* validatePositive(parsed);
			const squared = yield* calculateSquare(validated);

			return {
				original: '5',
				parsed,
				validated,
				squared,
			};
		});

		expect(successResult).toEqual([
			null,
			{
				original: '5',
				parsed: 5,
				validated: 5,
				squared: 25,
			},
		]);

		// Test parsing error
		const parseError = fx.gen(function* () {
			const parsed = yield* parseNumber('abc');
			const validated = yield* validatePositive(parsed);
			const squared = yield* calculateSquare(validated);

			return { parsed, validated, squared };
		});

		expect(parseError).toEqual(['Cannot parse "abc" as number', null]);

		// Test validation error
		const validationError = fx.gen(function* () {
			const parsed = yield* parseNumber('-5');
			const validated = yield* validatePositive(parsed);
			const squared = yield* calculateSquare(validated);

			return { parsed, validated, squared };
		});

		expect(validationError).toEqual(['Number -5 must be positive', null]);
	});

	test('should maintain type safety with typed fx.fn functions', () => {
		const getUser = fx.fn((id: number) => {
			if (id === 1) {
				return fx.ok({ id: 1, name: 'John', email: 'john@example.com' });
			}
			return fx.err('User not found');
		});

		const getUserPosts = fx.fn((userId: number) => {
			if (userId === 1) {
				return fx.ok([
					{ id: 1, title: 'First Post', authorId: 1 },
					{ id: 2, title: 'Second Post', authorId: 1 },
				]);
			}
			return fx.err('No posts found');
		});

		const result = fx.gen(function* () {
			const user = yield* getUser(1);
			const posts = yield* getUserPosts(user.id);

			return {
				userInfo: `${user.name} <${user.email}>`,
				postCount: posts.length,
				postTitles: posts.map((p: any) => p.title),
			};
		});

		expect(result).toEqual([
			null,
			{
				userInfo: 'John <john@example.com>',
				postCount: 2,
				postTitles: ['First Post', 'Second Post'],
			},
		]);
	});
});
