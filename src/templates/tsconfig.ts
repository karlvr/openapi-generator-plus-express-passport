import { ts, each } from '@openapi-generator-plus/template-utils'
import { TypeScriptOptions, TemplateRootContext } from '@openapi-generator-plus/typescript-generator-common'

export function tsconfig(ctx: TemplateRootContext & TypeScriptOptions): string {
	return ts`
{
	"compilerOptions": {
		"declaration": true,
		"target": "${ctx.target}",
		"module": "commonjs",
		"noImplicitAny": true,
		"esModuleInterop": true,
		"allowSyntheticDefaultImports": true,
		"outDir": "dist",
		"lib": [
			${each(ctx.libs, (lib, _i, _isFirst, isLast) => `"${lib}"${isLast ? '' : ','}`, '\n')}
		]
	},
	"include": [
		"./${ctx.relativeSourceOutputPath}"
	]
}
`
}
