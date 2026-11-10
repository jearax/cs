import { defineSkin } from '@jjuidev/styles/theme';

/**
 * The site's own skin. The values live in `cs.css` next to this file; `defineSkin` only names
 * the skin and loads no CSS. The id is the one the pre-paint script in `index.html` writes, so the two
 * stay in step.
 */
export const CS_SKIN = defineSkin({
	id: 'cs',
	label: 'cs'
});

declare module '@jjuidev/styles/theme' {
	interface Register {
		skins: [typeof CS_SKIN];
	}
}
