import type { StdErrAdapter } from '.';

/** matches an instance of Error and returns the message */
export const messageErr =
	(fallbackMessage: string): StdErrAdapter =>
	(err: unknown) => {
		if (err instanceof Error === false) return undefined;
		return {
			root: [err.message || fallbackMessage],
			form: {},
		};
	};

export const stringErr = (): StdErrAdapter => (err: unknown) => {
	if (typeof err !== 'string') return undefined;
	return {
		root: [err],
		form: {},
	};
};

/** ignores error and sets a hardcoded root message */
export const hardcodedErr =
	(message: string): StdErrAdapter =>
	() => {
		return {
			root: [message],
			form: {},
		};
	};
