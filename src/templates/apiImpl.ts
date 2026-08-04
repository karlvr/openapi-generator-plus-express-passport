import { CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, when, identifier } from '@openapi-generator-plus/template-utils'
import { apiImpl as apiImplFragment } from './frag/apiImpl'
import { GroupContext } from './types'

export function apiImpl(generatorContext: CodegenGeneratorContext, ctx: GroupContext): string {
	const generator = generatorContext.generator()
	return ts`
import * as t from '../api/${identifier(generator, ctx.name)}/types'
${when(ctx.containsMultipartOperation, () => `import * as f from './helpers/${identifier(generator, ctx.name)}MultipartHelper'`)}
import { Api } from '../models'

${apiImplFragment(generatorContext, ctx)}
`
}
