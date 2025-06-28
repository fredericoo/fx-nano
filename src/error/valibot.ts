import { ValiError } from 'valibot';
import { flatten } from 'valibot';
import type { ErrSieve, SifterErr } from '.';

export const handleValiError = (): ErrSieve => (err: unknown) => {
	if (err instanceof ValiError === false) return undefined;
	const issues = flatten(err.issues);

	const output: SifterErr = {
		root: [],
		form: issues.nested ?? {},
	};
	if (issues.root) output.root.push(...issues.root);
	if (issues.other) output.root.push(...issues.other);
	return output;
};
