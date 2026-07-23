import { defineCommand, runMain } from 'citty'

import { description, name, version } from '../package.json'
import { configCommand, currentCommand, lsCommand, removeCommand, resetCommand, useCommand } from '@/commands'
import { displayBanner } from '@/utils/banner'
import { logger } from '@/utils/logger'

const COMMANDS = [
	{
		name: 'config',
		description: 'Manage profile configuration'
	},
	{
		name: 'use',
		description: 'Switch to a profile'
	},
	{
		name: 'current',
		description: 'Show current active profile'
	},
	{
		name: 'ls',
		description: 'List all profiles'
	},
	{
		name: 'remove',
		description: 'Remove a profile'
	},
	{
		name: 'reset',
		description: 'Reset to default profile'
	}
]

const main = defineCommand({
	meta: {
		name,
		version,
		description
	},
	subCommands: {
		ls: lsCommand,
		config: configCommand,
		current: currentCommand,
		use: useCommand,
		remove: removeCommand,
		reset: resetCommand
	},
	run: async (ctx) => {
		// Only show commands list when no subcommand is invoked
		if ((ctx.args._ as string[])?.length) {
			return
		}

		displayBanner()
		logger.text('Available commands:\n')

		for (const cmd of COMMANDS) {
			logger.log(`  ${cmd.name.padEnd(10)} ${cmd.description}`)
		}

		logger.muted('\nRun cs <command> --help for usage.')
	}
})

runMain(main)
