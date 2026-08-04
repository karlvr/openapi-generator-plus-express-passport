import { CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, maybe } from '@openapi-generator-plus/template-utils'
import { apiImpl } from './frag/apiImpl'
import { GroupContext } from './types'

export function apiReadme(generatorContext: CodegenGeneratorContext, ctx: GroupContext): string {
	return ts`
# ${ctx.name}

${maybe(ctx.info.description)}

## Operations

${each(ctx.operations, operation => ts`
### ${operation.name}

\`\`\`http
${operation.httpMethod} ${operation.fullPath}
\`\`\`

${maybe(operation.description)}

`, '')}## Implementation

This is an example of the API implementation to use to update the actual API implementation
when the API structure has changed.

\`\`\`typescript
${apiImpl(generatorContext, ctx)}
\`\`\`
`
}
