import { Bot, Cog, List, Power, RefreshCcw, Repeat, Trash2, Variable } from 'lucide-react';

import { COMMANDS } from '@/constants/commands.constant';
import { docsHref } from '@/constants/routes.constant';

/** One icon per command, so a card reads as a thing and not as a paragraph. */
const ICON_BY_COMMAND = {
	config: Cog,
	use: Power,
	current: Repeat,
	list: List,
	remove: Trash2,
	reset: RefreshCcw,
	env: Variable,
	alias: Bot
} as const;

export type FeatureIcon = typeof Bot;

export type Feature = {
	/** The command's own name. */
	name: string;
	/** The command line the reader runs. */
	command: string;
	/** What the command does, in one sentence. */
	summary: string;
	/** What the command does, in the rest. */
	details: string;
	/** The docs page that explains the command. */
	href: string;
	icon: FeatureIcon | undefined;
};

/**
 * The three commands as the cards that show them. The cards read the command's own facts, so the
 * home page and the docs cannot drift apart.
 */
export const FEATURES: readonly Feature[] = COMMANDS.map((command) => {
	return {
		name: command.name,
		command: command.command,
		summary: command.summary,
		details: command.details,
		href: docsHref(command.slug),
		icon: ICON_BY_COMMAND[command.name as keyof typeof ICON_BY_COMMAND]
	};
});
