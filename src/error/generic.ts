import type { ErrSieve } from '.';
import { UnhandledError } from '../result';

/** matches an instance of Error and returns the message */
export const handleErrorClass =
	(fallbackMessage?: string): ErrSieve =>
	(err: unknown) => {
		if (err instanceof Error === false) return undefined;
		return {
			root: [err.message || fallbackMessage || 'Unknown error'],
			form: {},
		};
	};

/** ignores error and sets a hardcoded root message or array of messages */
export const staticErr =
	(message: string | string[]): ErrSieve =>
	() => {
		return { root: Array.isArray(message) ? message : [message], form: {} };
	};

export const unwrapUnhandledErr = (): ErrSieve => (error, sifter) => {
	if (error instanceof UnhandledError) return sifter(error.originalError);
	return undefined;
};
