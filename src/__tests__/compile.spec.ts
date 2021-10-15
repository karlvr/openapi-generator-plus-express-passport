import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { build, prepare, DEFAULT_CONFIG } from './common'
import fs from 'fs'
import path from 'path'

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
				await testGenerate(result, { postProcess: build, testName: file })
			})
		}
	}

	const basePath = path.join(__dirname, '..', '..', '__tests__', 'specs')
	compileFiles(basePath, fs.readdirSync(basePath))

	const sharedBasePath = path.join(__dirname, '../../../openapi-generator-plus-generators/__tests__/specs')
	if (fs.existsSync(sharedBasePath)) {
		compileFiles(sharedBasePath, fs.readdirSync(sharedBasePath))
	}
})
