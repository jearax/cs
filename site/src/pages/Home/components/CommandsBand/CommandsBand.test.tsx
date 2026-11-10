import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { BAND_COMMANDS, FEATURES } from '@/pages/Home/constants/feature.constant';

import CommandsBand from './CommandsBand';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('CommandsBand', () => {
	it('shows one row of the band commands, and no other card', async () => {
		const screen = await render(<CommandsBand />, { wrapper });

		for (const name of BAND_COMMANDS) {
			await expect.element(screen.getByRole('heading', { name: new RegExp(`cs ${name}`) })).toBeInTheDocument();
		}

		const commandHeadings = screen.container.querySelectorAll('h3');

		expect(commandHeadings.length).toBe(BAND_COMMANDS.length);
	});

	it('links every band card to its docs', async () => {
		const screen = await render(<CommandsBand />, { wrapper });

		for (const name of BAND_COMMANDS) {
			const feature = FEATURES.find((entry) => {
				return entry.name === name;
			});

			await expect
				.element(screen.getByRole('link', { name: `Read the ${name} docs` }))
				.toHaveAttribute('href', feature?.href);
		}
	});

	it('hands the rest of the commands to the reference docs', async () => {
		const screen = await render(<CommandsBand />, { wrapper });

		await expect
			.element(screen.getByRole('link', { name: /All nine commands/ }))
			.toHaveAttribute('href', '/docs/reference');
	});
});
