import { describe, expect, it, vi } from 'vitest';

describe('main', () => {
	it('logs the greeting', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation((): void => {
			return undefined;
		});

		const { main } = await import('./main');

		main();

		expect(log).toHaveBeenCalledWith('Hello from cs');

		log.mockRestore();
	});
});
