import { ts, each, identifier } from '@openapi-generator-plus/template-utils'
import { CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { header } from './header'
import { DocumentContext } from './types'

export function entry(generatorContext: CodegenGeneratorContext, ctx: DocumentContext): string {
	const generator = generatorContext.generator()
	return ts`
${header(ctx)}

import { Express } from 'express'
${each(ctx.groups, g => `import ${identifier(generator, g.name)} from './api/${identifier(generator, g.name)}'`, '\n')}
import * as t from './types'
import { setValidationOptions } from './validation'

export default function(app: Express, impl: t.ApiImplementation, options?: t.ApiOptions) {
	setValidationOptions(options)

	${each(ctx.groups, g => `${identifier(generator, g.name)}(app, impl.${identifier(generator, g.name)})`, '\n')}
}
`
}
