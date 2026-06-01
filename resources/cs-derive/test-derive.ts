import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { CopilotModelsResponse } from './copilot-schema'
import { deriveModels } from './opencode-derive'

const raw = JSON.parse(readFileSync(resolve(__dirname, 'copilot-raw.json'), 'utf8')) as CopilotModelsResponse

const out = deriveModels(raw)

process.stdout.write(JSON.stringify(out, null, 2) + '\n')
