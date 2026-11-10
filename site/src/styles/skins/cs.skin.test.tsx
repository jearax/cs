import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { CS_SKIN } from './cs.skin';

const wrapper = ({ children }: { children: ReactNode }) => {
	return <ThemeProvider skins={[CS_SKIN]}>{children}</ThemeProvider>;
};

describe('the site skin', () => {
	it('is the skin the provider applies', async () => {
		document.cookie = `jds-skin=${CS_SKIN.id}`;

		await render(<div />, { wrapper });

		await expect
			.poll(() => {
				return document.documentElement.dataset.skin;
			})
			.toBe(CS_SKIN.id);
	});

	it('paints the page with the skin values, not the platform ones', async () => {
		document.cookie = `jds-skin=${CS_SKIN.id}`;

		await render(<div />, { wrapper });

		await expect
			.poll(() => {
				return getComputedStyle(document.documentElement).getPropertyValue('--color-primary-700').trim();
			})
			.toBe('#70422c');
	});

	it('paints the secondary as a companion warm grey, not a second accent', async () => {
		document.cookie = `jds-skin=${CS_SKIN.id}`;

		await render(<div />, { wrapper });

		await expect
			.poll(() => {
				return getComputedStyle(document.documentElement).getPropertyValue('--color-secondary-700').trim();
			})
			.toBe('#5a5652');
	});

	it('keeps the status scales the package owns, so a failure still reads as one', async () => {
		document.cookie = `jds-skin=${CS_SKIN.id}`;

		await render(<div />, { wrapper });

		const computed = getComputedStyle(document.documentElement);

		await expect
			.poll(() => {
				return computed.getPropertyValue('--color-error-600').trim();
			})
			.toBe('#b73503');
		await expect
			.poll(() => {
				return computed.getPropertyValue('--color-success-600').trim();
			})
			.toBe('#01786e');
	});

	it('is named the same in the document shell', async () => {
		const shell = await fetch('/index.html').then((response) => {
			return response.text();
		});

		expect(shell).toContain(`jds-skin=${CS_SKIN.id}`);
	});

	it('is not shared with the other hosts on the domain', async () => {
		const shell = await fetch('/index.html').then((response) => {
			return response.text();
		});

		// A Domain attribute would make this site's default skin a preference every host on the domain reads.
		expect(shell).not.toContain('Domain=');
	});
});
