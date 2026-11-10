import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import Pager from './Pager';

const renderAt = (path: string) => {
	const wrapper = ({ children }: { children: ReactNode }) => {
		return (
			<ThemeProvider>
				<MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
			</ThemeProvider>
		);
	};

	return render(<Pager />, { wrapper });
};

describe('Pager', () => {
	it('shows the two neighbouring pages leaning apart, named direction then title', async () => {
		const screen = await renderAt('/docs/install');

		await expect
			.element(screen.getByRole('link', { name: 'Previous Getting started' }))
			.toHaveAttribute('href', '/docs/getting-started');
		await expect
			.element(screen.getByRole('link', { name: 'Next Reference' }))
			.toHaveAttribute('href', '/docs/reference');
	});

	it('hides the arrows from the accessibility tree, so names stay direction then title', async () => {
		const screen = await renderAt('/docs/install');

		// Both lucide arrows are rendered as art inside the direction labels.
		expect(screen.container.querySelectorAll('svg[aria-hidden="true"]').length).toBe(2);

		// The accessible name is exactly the label plus the title; the icons add nothing.
		await expect.element(screen.getByRole('link', { name: 'Previous Getting started' })).toBeInTheDocument();
		await expect.element(screen.getByRole('link', { name: 'Next Reference' })).toBeInTheDocument();
	});
});
