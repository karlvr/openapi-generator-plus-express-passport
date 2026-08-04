import { CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, className } from '@openapi-generator-plus/template-utils'
import { GroupContext } from './types'

export function apiMultipartHelper(generatorContext: CodegenGeneratorContext, ctx: GroupContext): string {
	return ts`
import multer from 'multer'

/**
 * File upload handling for multipart operations in the ${className(generatorContext.generator(), ctx.name)} API endpoint.
 */
export const upload = multer({
    storage: multer.memoryStorage(),
})
`
}
