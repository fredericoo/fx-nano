import * as generic from './generic';

export type StdErr = {
	root: string[];
	form: Record<string, string[] | undefined>;
};

export type StdErrAdapter = (error: unknown) => Partial<StdErr> | undefined;

export const stdErr = {
	errorInstance: generic.messageErr,
	string: generic.stringErr,
	fallback: generic.hardcodedErr,
	make:
		(adapters: StdErrAdapter[]) =>
		(error: unknown): StdErr => {
			const output: StdErr = {
				root: [],
				form: {},
			};

			for (const adapter of adapters) {
				const fromAdapter = adapter(error);
				if (!fromAdapter) continue;

				if (fromAdapter.root) output.root = fromAdapter.root;
				if (fromAdapter.form) output.form = fromAdapter.form;
				return output;
			}

			return output;
		},
};
