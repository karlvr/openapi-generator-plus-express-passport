import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile, prepare, DEFAULT_CONFIG } from './common'
import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'

describe('compile test cases', () => {
	function compileFiles(basePath: string, files: string[]) {
		for (const file of files) {
			test(file, async() => {
				const result = await prepare(path.join(basePath, file), {
					...DEFAULT_CONFIG,
					npm: {
						...(DEFAULT_CONFIG.npm as Record<string, unknown> || {}),
						name: path.basename(file),
					},
					includeTests: true,
				})
				await testGenerate(result, { postProcess: compile, testName: file })
			})
		}
	}

	const basePath = path.join(__dirname, '..', '..', '__tests__', 'specs')
	if (fs.existsSync(basePath)) {
		compileFiles(basePath, globSync('**/*.{yml,yaml}', { cwd: basePath }))
	} else {
		console.warn(`Cannot find __tests__ in local repo: ${basePath}`)
	}

	const sharedBasePath = path.join(__dirname, '../../../openapi-generator-plus-generators/__tests__/specs')
	if (fs.existsSync(sharedBasePath)) {
		compileFiles(sharedBasePath, globSync('**/*.{yml,yaml}', { cwd: sharedBasePath }))
	}

	const ciSharedBasePath = path.join(__dirname, '../../test-input/__tests__/specs')
	if (fs.existsSync(ciSharedBasePath)) {
		compileFiles(ciSharedBasePath, fs.readdirSync(ciSharedBasePath))
	}
})
