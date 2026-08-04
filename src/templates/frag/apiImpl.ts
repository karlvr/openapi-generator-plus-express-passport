import { CodegenGeneratorContext, CodegenOperationGroup } from '@openapi-generator-plus/types'
import { ts, each, identifier, className } from '@openapi-generator-plus/template-utils'
import { operationSignatureParams } from './operationSignature'

/**
 * An example implementation of the group's API: a stub per operation, and the
 * object that binds them together.
 */
export function apiImpl(generatorContext: CodegenGeneratorContext, group: CodegenOperationGroup): string {
	const generator = generatorContext.generator()
	return ts`
${each(group.operations, operation => ts`
async function ${identifier(generator, operation.name)}(${operationSignatureParams(generatorContext, operation)}): Promise<t.${className(generator, operation.name)}Response> {
	throw 'Unimplemented'
}
`, '\n')}

const api: t.${className(generator, group.name)}Api = {
	${each(group.operations, operation => `${identifier(generator, operation.name)},`, '\n')}
}

export default api`
}
