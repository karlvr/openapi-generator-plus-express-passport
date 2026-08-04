import { CodegenGeneratorContext, CodegenOperation, CodegenParameter, CodegenRequestBody } from '@openapi-generator-plus/types'
import { identifier } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { parameterArgument } from './params'

/**
 * The declared parameters of the API implementation function for `operation`, as
 * they appear in both the API interface and the example implementation.
 */
export function operationSignatureParams(generatorContext: CodegenGeneratorContext, operation: CodegenOperation): string {
	const generator = generatorContext.generator()
	return operationArgumentList(
		operation,
		param => `${identifier(generator, param.name)}: ${param.nativeType}${param.required ? '' : ' | undefined'}`,
		requestBody => `${identifier(generator, requestBody.name)}: ${requestBody.nativeType}${requestBody.required ? '' : ' | undefined'}`,
		'__user: any',
	)
}

/**
 * The arguments passed to the API implementation function when dispatching an
 * Express request.
 */
export function operationCallArguments(generatorContext: CodegenGeneratorContext, operation: CodegenOperation): string {
	return operationArgumentList(
		operation,
		param => parameterArgument(generatorContext, param),
		requestBody => requestBody.defaultContent?.schema ? '__body()' : '',
		'__user',
	)
}

/**
 * Assemble the parameter, request body and authenticated user parts of an
 * operation's argument list. The separators are governed by the presence of the
 * operation's `parameters` and `requestBody`, rather than by whether those parts
 * actually rendered anything.
 */
function operationArgumentList(
	operation: CodegenOperation,
	renderParam: (param: CodegenParameter) => string,
	renderRequestBody: (requestBody: CodegenRequestBody) => string,
	user: string,
): string {
	let result = operation.parameters ? idx.allValues(operation.parameters).map(renderParam).join(', ') : ''

	const requestBody = operation.requestBody
	if (requestBody?.nativeType) {
		result += `${operation.parameters ? ', ' : ''}${renderRequestBody(requestBody)}`
	}

	if (operation.securityRequirements) {
		result += `${operation.parameters || requestBody ? ', ' : ''}${user}`
	}

	return result
}
