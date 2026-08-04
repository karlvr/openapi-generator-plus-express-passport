import { ts, each, identifier, className } from '@openapi-generator-plus/template-utils'
import { CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { header } from './header'
import { DocumentContext } from './types'

export function indexTypes(generatorContext: CodegenGeneratorContext, ctx: DocumentContext): string {
	const generator = generatorContext.generator()
	return ts`
${header(ctx)}

${each(ctx.groups, g => `import * as ${identifier(generator, g.name)} from './api/${identifier(generator, g.name)}/types'`, '\n')}

export interface ApiImplementation {
	${each(ctx.groups, g => `${identifier(generator, g.name)}: ${identifier(generator, g.name)}.${className(generator, g.name)}Api`, '\n')}
}

export interface ApiOptions {
	failOnUnknownProperties?: boolean
}
`
}
