/**
 * The facts the docs area states that no other route states. A value two routes share lives in
 * `@/constants/`, so the home page and the docs area cannot drift apart.
 *
 * cs has no presets, no file plan and no machine checks of its own: the pages carry their tables
 * from `@/constants/reference.constant.ts` instead.
 */

export type SectionMeta = {
	/** The anchor the table of contents links to. */
	id: string;
	/** The heading the reader sees. */
	title: string;
};

/**
 * The metadata of one section, taken from the page's own list.
 *
 * A page asks for a section by its id and never writes the title out again, so a heading has one
 * home: the page's own constant file. The id is checked against that list at compile time, so a
 * page cannot ask for a section it does not have.
 */
export const sectionMeta = <T extends readonly SectionMeta[]>(sections: T, id: T[number]['id']): SectionMeta => {
	const found = sections.find((section) => {
		return section.id === id;
	});

	if (found === undefined) {
		throw new Error(`The page has no section named ${id}.`);
	}

	return found;
};
