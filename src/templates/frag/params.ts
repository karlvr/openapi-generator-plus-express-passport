import { CodegenGeneratorContext, CodegenParameter } from '@openapi-generator-plus/types'
import { stringLiteral } from '@openapi-generator-plus/template-utils'
import { parseType } from './parseType'

/**
 * Render the expression that extracts and validates `param` from the Express
 * request, for use as an argument to the API implementation.
 */
export function parameterArgument(generatorContext: CodegenGeneratorContext, param: CodegenParameter): string {
	const parse = parseType(generatorContext, param, 'v.')
	const name = stringLiteral(generatorContext, param.serializedName)

	if (param.isQueryParam) {
		return `${parse}(${stringLiteral(generatorContext, `query.${param.serializedName}`)}, req.query[${name}])`
	} else if (param.isPathParam) {
		return `${parse}(${stringLiteral(generatorContext, `params.${param.serializedName}`)}, req.params[${name}])`
	} else if (param.isHeaderParam) {
		return `${parse}(${stringLiteral(generatorContext, `header.${param.serializedName}`)}, req.get(${name}))`
	} else if (param.isFormParam) {
		return `${parse}(${stringLiteral(generatorContext, `form.${param.serializedName}`)}, req.body[${name}])`
	} else if (param.isCookieParam) {
		/* NB. the label says `header.` — preserved from the original templates. */
		return `${parse}(${stringLiteral(generatorContext, `header.${param.serializedName}`)}, req.cookies[${name}])`
	} else {
		return ''
	}
}
