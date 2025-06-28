import { expect, test } from 'vitest';
import { makeSifter } from './error';
import { handleErrorClass, staticErr, unwrapUnhandledErr } from './error/generic';
import { handleValiError } from './error/valibot';
import { UnhandledError, fg } from './result';

test('fx.run - successful execution returning fx.ok', () => {
	const result = fg.run(() => {
		return fg.ok(42);
	});

	expect(result).toEqual([null, 42]);
});

test('fx.run - successful execution returning fx.err', () => {
	const result = fg.run(() => {
		return fg.err('Something went wrong');
	});

	expect(result).toEqual(['Something went wrong', null]);
});

test('fx.run - function throws exception', () => {
	const result = fg.run(() => {
		throw new Error('Unexpected error');
	});

	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBeInstanceOf(Error);
	expect(((result[0] as UnhandledError).originalError as Error).message).toBe('Unexpected error');
});

test('fx.run - function throws non-Error value', () => {
	const result = fg.run(() => {
		throw 'String error';
	});

	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBe('String error');
});

test('fx.runPromise - successful async execution returning fx.ok', async () => {
	const promise = (async () => {
		await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
		return fg.ok('async success');
	})();

	const result = await fg.runPromise(promise);

	expect(result).toEqual([null, 'async success']);
});

test('fx.runPromise - successful async execution returning fx.err', async () => {
	const promise = (async () => {
		await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
		return fg.err('async error');
	})();

	const result = await fg.runPromise(promise);

	expect(result).toEqual(['async error', null]);
});

test('fx.runPromise - promise rejects', async () => {
	const promise = (async () => {
		await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
		throw new Error('Promise rejected');
	})();

	const result = await fg.runPromise(promise);

	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBeInstanceOf(Error);
	expect(((result[0] as UnhandledError).originalError as Error).message).toBe('Promise rejected');
});

test('fx.runPromise - promise rejects with non-Error value', async () => {
	const promise = (async () => {
		await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
		throw 'String rejection';
	})();

	const result = await fg.runPromise(promise);

	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBe('String rejection');
});

test('fx.runPromise - handles immediately resolved promise', async () => {
	const result = await fg.runPromise(Promise.resolve(fg.ok('immediate')));

	expect(result).toEqual([null, 'immediate']);
});

test('fx.runPromise - handles immediately rejected promise', async () => {
	const result = await fg.runPromise(Promise.reject(new Error('immediate rejection')));

	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBeInstanceOf(Error);
	expect(((result[0] as UnhandledError).originalError as Error).message).toBe('immediate rejection');
});

const doStuff = fg.fn(async () => {
	if (Math.random() > 0.5) {
		return fg.ok('success');
	}
	return fg.err('error');
});

const sift = makeSifter(handleValiError(), handleErrorClass(), unwrapUnhandledErr(), staticErr('Something went wrong'));

const _main = async () => {
	const [error, result] = await fg.runPromise(doStuff());

	if (error) {
		return sift(error); // { root: ['error'], form: {} }
	}

	return result; // 'success'
};
