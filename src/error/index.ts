export type SifterErr = {
	root: string[];
	form: Record<string, string[] | undefined>;
};

export type ErrSieve = (error: unknown, sifter: Sifter) => Partial<SifterErr> | undefined;

export type Sifter = (error: unknown) => SifterErr | undefined;

export const makeSifter = (...sieves: ErrSieve[]): Sifter => {
	const sifter: Sifter = (error) => {
		const output: SifterErr = {
			root: [],
			form: {},
		};

		for (const sieve of sieves) {
			const fromSieve = sieve(error, sifter);
			if (!fromSieve) continue;

			if (fromSieve.root) output.root = fromSieve.root;
			if (fromSieve.form) output.form = fromSieve.form;
			return output;
		}

		console.error('stdErr: no adapter handled the error', error);
		throw new Error('stdErr: no adapter handled the error');
	};

	return sifter;
};
