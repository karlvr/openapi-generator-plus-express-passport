import { ts, join, when } from '@openapi-generator-plus/template-utils'
import { NpmOptions, TemplateRootContext, DateApproach } from '@openapi-generator-plus/typescript-generator-common'
import { RootContext } from './types'

export function packageJson(ctx: TemplateRootContext & NpmOptions): string {
	const root = ctx as TemplateRootContext & NpmOptions & RootContext

	/* `publishConfig` is appended after the closing `}` of `devDependencies`,
	 * so it can't be on its own line — we precompute either the trailing block
	 * or an empty string and interpolate that mid-line. */
	const publishConfig = ctx.repository ? ts`,
	"publishConfig": {
		"registry": "${ctx.repository}"
	}` : ''

	return ts`
{
	"name": "${ctx.name}",
	${when(ctx.private, '"private": true,')}
	"version": "${ctx.version}",
	"description": "API client for ${ctx.name}",
	"author": "@openapi-generator-plus/typescript-fetch-client-generator",
	"keywords": [
		"fetch",
		"typescript",
		"swagger",
		"openapi",
		"${ctx.name}"
	],
	"license": "UNLICENSED",
	"main": "./dist/index.js",
	"typings": "./dist/index.d.ts",
	"scripts": {
		"build": "tsc",
		"prepare": "npm run build"
	},
	"dependencies": {
		${join([
			'"whatwg-fetch": "^3.6.2"',
			when(root.dateApproach === DateApproach.BlindDate, '"blind-date": "^3.3.0"'),
			'"express": "^4.18.2"',
			'"passport": "^0.6.0"',
			'"multer": "^1.4.5-lts.1"',
		], ',\n')}
	},
	"devDependencies": {
		"@types/express": "^4.17.17",
		"@types/node": "^18.15.11",
		"@types/passport": "^1.0.12",
		"@types/multer": "^1.4.11",
		"typescript": "^4.9.5"
	}${publishConfig}
}
`
}
