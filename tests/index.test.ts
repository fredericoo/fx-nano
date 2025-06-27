import { expect, test } from 'vitest'
import { fx, UnhandledError } from "../src/index";

test('fx.run - successful execution returning fx.ok', () => {
	const result = fx.run(() => {
		return fx.ok(42);
	});
	
	expect(result).toEqual([null, 42]);
});

test('fx.run - successful execution returning fx.err', () => {
	const result = fx.run(() => {
		return fx.err("Something went wrong");
	});
	
	expect(result).toEqual(["Something went wrong", null]);
});

test('fx.run - function throws exception', () => {
	const result = fx.run(() => {
		throw new Error("Unexpected error");
	});
	
	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBeInstanceOf(Error);
	expect(((result[0] as UnhandledError).originalError as Error).message).toBe("Unexpected error");
});

test('fx.run - function throws non-Error value', () => {
	const result = fx.run(() => {
		throw "String error";
	});
	
	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBe("String error");
});

test('fx.runPromise - successful async execution returning fx.ok', async () => {
	const promise = (async () => {
		await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
		return fx.ok("async success");
	})();
	
	const result = await fx.runPromise(promise);
	
	expect(result).toEqual([null, "async success"]);
});

test('fx.runPromise - successful async execution returning fx.err', async () => {
	const promise = (async () => {
		await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
		return fx.err("async error");
	})();
	
	const result = await fx.runPromise(promise);
	
	expect(result).toEqual(["async error", null]);
});

test('fx.runPromise - promise rejects', async () => {
	const promise = (async () => {
		await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
		throw new Error("Promise rejected");
	})();
	
	const result = await fx.runPromise(promise);
	
	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBeInstanceOf(Error);
	expect(((result[0] as UnhandledError).originalError as Error).message).toBe("Promise rejected");
});

test('fx.runPromise - promise rejects with non-Error value', async () => {
	const promise = (async () => {
		await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
		throw "String rejection";
	})();
	
	const result = await fx.runPromise(promise);
	
	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBe("String rejection");
});

test('fx.runPromise - handles immediately resolved promise', async () => {
	const result = await fx.runPromise(Promise.resolve(fx.ok("immediate")));
	
	expect(result).toEqual([null, "immediate"]);
});

test('fx.runPromise - handles immediately rejected promise', async () => {
	const result = await fx.runPromise(Promise.reject(new Error("immediate rejection")));
	
	expect(result[0]).toBeInstanceOf(UnhandledError);
	expect(result[1]).toBe(null);
	expect((result[0] as UnhandledError).originalError).toBeInstanceOf(Error);
	expect(((result[0] as UnhandledError).originalError as Error).message).toBe("immediate rejection");
});