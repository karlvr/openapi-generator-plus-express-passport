import { CodegenGeneratorContext, CodegenHeader, CodegenMediaType, CodegenOperation, CodegenResponse, CodegenSchemaUsage } from '@openapi-generator-plus/types'
import { ts, each, when, identifier, className, stringLiteral } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { header } from './header'
import { operationSignatureParams } from './frag/operationSignature'
import { GroupContext } from './types'

export function apiTypes(generatorContext: CodegenGeneratorContext, ctx: GroupContext): string {
	const generator = generatorContext.generator()

	const operationTypes = ctx.operations.map(operation => {
		const responses = operation.responses ? idx.allValues(operation.responses) : []
		const responseType = responses.map(response => responseTypeName(generatorContext, operation, response)).join(' | ')
		const responseInterfaces = responses.map(response => `${responseInterface(generatorContext, operation, response)}\n\n`).join('')
		return `export type ${className(generator, operation.name)}Response = ${responseType}\n\n${responseInterfaces}`
	}).join('')

	return ts`
${header(ctx)}

import { Express } from 'express'
import { Api } from '../../models'

export interface ${className(generator, ctx.name)}Api {
	${each(ctx.operations, operation => `${identifier(generator, operation.name)}: (${operationSignatureParams(generatorContext, operation)}) => Promise<${className(generator, operation.name)}Response>`, '\n')}
}

${operationTypes}`
}

function responseTypeName(generatorContext: CodegenGeneratorContext, operation: CodegenOperation, response: CodegenResponse): string {
	return `${className(generatorContext.generator(), `${operation.name}_${response.code}`)}Response`
}

function responseInterface(generatorContext: CodegenGeneratorContext, operation: CodegenOperation, response: CodegenResponse): string {
	const content = response.defaultContent
	return ts`
export interface ${responseTypeName(generatorContext, operation, response)} {
	${response.isCatchAll ? ts`
/* Catch-all response */
status: '${String(response.code)}'
actualStatus: number` : `status: ${String(response.code)}`}
	${when(content?.mediaType.wildcard, () => `mediaType: ${mediaTypeLiteral(content!.mediaType)}`)}
	${content?.nativeType ? `body: ${content.nativeType}` : 'body?: never'}
	${responseHeaders(generatorContext, response)}
}`
}

function responseHeaders(generatorContext: CodegenGeneratorContext, response: CodegenResponse): string {
	if (!response.headers) {
		return 'headers?: never'
	}
	/* A CodegenHeader is built from a CodegenSchemaUsage, so it carries a nativeType. */
	return ts`
headers: {
${each(response.headers as Record<string, CodegenHeader & CodegenSchemaUsage>, h => `	${stringLiteral(generatorContext, h.name)}: ${h.nativeType}`, '\n')}
}`
}

/** A template literal type for a media type, where a wildcard accepts any string. */
function mediaTypeLiteral(mediaType: CodegenMediaType): string {
	return `\`${mediaType.mediaType.replace(/\*/g, '${string}')}\``
}
