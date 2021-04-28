import { exec } from 'child_process'
import path from 'path'
import { CodegenConfig } from '@openapi-generator-plus/types'
import { CodegenResult, createCodegenResult } from '@openapi-generator-plus/testing'
import createGenerator from '..'

export const DEFAULT_CONFIG: CodegenConfig = {
	npm: {
		name: 'test',
	},
}

export async function prepare(spec: string, config?: CodegenConfig): Promise<CodegenResult> {
	return createCodegenResult(path.resolve(__dirname, spec), config || DEFAULT_CONFIG, createGenerator)
}

export async function build(basePath: string): Promise<void> {
	return new Promise(function(resolve, reject) {
		exec(
			'npm install 2>&1',
			{
				cwd: basePath,
			},
			function(error, stdout, stderr) {
				if (!error) {
					resolve()
					return
				}
				reject(`Failed to build ${basePath}:\n${stdout}`)
			}
		)
	})
}
