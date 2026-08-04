import {
	CodegenContent,
	CodegenGeneratorContext,
	CodegenObjectSchema,
	CodegenOperation,
	CodegenResponse,
} from '@openapi-generator-plus/types'
import {
	ts,
	each,
	when,
	maybe,
	identifier,
	className,
	lowerCase,
	stringLiteral,
	isBinary,
	isContentJson,
	isContentMultipart,
	isString,
	SKIP,
	Skip,
} from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { header } from './header'
import { apiSecurityRequirements } from './frag/apiSecurityRequirements'
import { fromRequest } from './frag/fromRequest'
import { toResponse } from './frag/toResponse'
import { operationCallArguments } from './frag/operationSignature'
import { containsMultipartOperation, fileUploadProperties } from './frag/fileUpload'
import { GroupContext } from './types'

const AUTHENTICATED_USER = ts`
const __user = req.user
if (!__user) {
	res.status(401)
	res.send()
	return
}`

export function api(generatorContext: CodegenGeneratorContext, ctx: GroupContext): string {
	const generator = generatorContext.generator()
	return ts`
${header(ctx)}

import { Express, Request, Response } from 'express'
import passport from 'passport'
import multer from 'multer'
import * as t from './types'
import * as v from '../../validation'
${when(ctx.containsMultipartOperation, () => `import * as f from '../../impl/helpers/${lowerCase(ctx.name)}MultipartHelper'`)}
import { Api } from '../../models'

export default function(app: Express, impl: t.${className(generator, ctx.name)}Api) {
	${each(ctx.operations, operation => `${apiOperation(generatorContext, ctx, operation)}\n`, '\n')}
}
`
}

/** Convert a path template from OpenAPI to Express. */
function pathTemplate(value: string): string {
	return value.replace(/{(.*?)}/g, ':$1')
}

function apiOperation(generatorContext: CodegenGeneratorContext, ctx: GroupContext, operation: CodegenOperation): string {
	const generator = generatorContext.generator()
	const groupName = identifier(generator, ctx.name)
	const operationName = identifier(generator, operation.name)

	return ts`
app.${lowerCase(operation.httpMethod)}(
	${stringLiteral(generatorContext, pathTemplate(operation.fullPath))},
	${apiSecurityRequirements(generatorContext, operation)}
	${multipartMiddleware(generatorContext, operation)}
	function (req: Request, res: Response) {
		try {
			${when(operation.securityRequirements, AUTHENTICATED_USER)}
			${maybe(requestBodyFunction(generatorContext, operation))}
			impl.${operationName}(${operationCallArguments(generatorContext, operation)}).then(function (response) {
				${responseHandling(generatorContext, operation, groupName, operationName)}
			}).catch(function (error) {
				console.error('Unexpected error in ${groupName}.${operationName}', error.stack || error)
				res.status(500)
				res.send()
			})
		} catch (error) {
			/* Catch validation errors */
			res.status(400)
			res.type('text/plain; charset=utf-8')
			res.send(error)
		}
	}
)`
}

/**
 * The multer middleware that receives the operation's file uploads, if it has any.
 */
function multipartMiddleware(generatorContext: CodegenGeneratorContext, operation: CodegenOperation): string | Skip {
	if (!containsMultipartOperation([operation])) {
		return SKIP
	}
	const properties = fileUploadProperties((operation.requestBody?.defaultContent.schema as CodegenObjectSchema | null | undefined)?.properties ?? null)
	if (properties.length === 0) {
		return SKIP
	}

	const fields = properties.map(p => `{ name: ${stringLiteral(generatorContext, p.name)}${p.maxCount !== null ? `, maxCount: ${p.maxCount}` : ''} }`).join(', ')

	return ts`
(req, res, next) => {
	const fileFields: multer.Field[] = [${fields}]
	f.upload.fields(fileFields)(req, res, (error) => {
		if (error?.code === 'LIMIT_UNEXPECTED_FILE') {
			const field = fileFields.find(field => field.name === error.field)
			if (field) {
				res.status(400).type('text/plain; charset=utf-8').send(\`The field '\${error.field}' allows a maximum of \${field.maxCount} file(s)\`)
			} else {
				res.status(400).type('text/plain; charset=utf-8').send(\`Unexpected field '\${error.field}' in multipart request\`)
			}
		} else {
			next(error)
		}
	})
},
${each(properties, p => when(p.minCount !== null, () => `v.verifyMinimumFiles(${stringLiteral(generatorContext, p.name)}, ${p.minCount}),`), '\n')}`
}

/**
 * The local `__body()` function that parses and validates the request body, with
 * a trailing blank line separating it from the implementation call.
 */
function requestBodyFunction(generatorContext: CodegenGeneratorContext, operation: CodegenOperation): string | null {
	const requestBody = operation.requestBody
	if (!requestBody?.defaultContent.schema) {
		return null
	}

	return ts`
function __body() {
	const __contentType = req.get('Content-Type')
	const __mimeType = __contentType ? __contentType.replace(/;.*/, '') : undefined

	${when(!requestBody.required, () => ts`
if (!__mimeType) {
	return undefined
}`)}
	${each(requestBody.contents, content => ts`
if (__mimeType === '${content.mediaType.mimeType}') {
	${requestBodyContent(generatorContext, content)}
}`, '\n')}
	console.error(\`Invalid request content type: \${__contentType}\`)
	throw new Error(\`Invalid request content type: \${__contentType}\`)
}
`
}

function requestBodyContent(generatorContext: CodegenGeneratorContext, content: CodegenContent): string {
	const schema = content.schema
	if (!schema) {
		return 'return undefined'
	}

	if (isContentMultipart(content)) {
		const properties = fileUploadProperties((schema as CodegenObjectSchema).properties ?? null)
		return ts`
if (req.files && !Array.isArray(req.files)) {
	${each(properties, p => {
		const name = stringLiteral(generatorContext, p.name)
		return `req.body[${name}] = req.files[${name}] ? req.files[${name}]${p.isArray ? '' : '[0]'} : undefined`
	}, '\n')}
}
return ${fromRequest(generatorContext, schema, 'v.')}('body', req.body)`
	} else if (isContentJson(content)) {
		return `return ${fromRequest(generatorContext, schema, 'v.')}('body', req.body)`
	} else if (isBinary(schema)) {
		return 'return req.body as Buffer'
	} else if (isString(schema)) {
		return 'return req.body as string'
	} else {
		return 'return req.body; /* Unsupported mimeType */'
	}
}

/**
 * The body of the `.then()` handler: a branch per response, then either the
 * catch-all response or a failure for an unrecognised one.
 */
function responseHandling(generatorContext: CodegenGeneratorContext, operation: CodegenOperation, groupName: string, operationName: string): string {
	const responses = operation.responses ? idx.allValues(operation.responses) : []
	const catchAll = operation.catchAllResponse

	const fallthrough = catchAll ? ts`
/* Catch-all response */
${responseBody(generatorContext, catchAll, groupName, operationName)}
res.status(response.actualStatus)
${responseHeaders(generatorContext, catchAll)}
${catchAll.defaultContent?.schema ? 'res.send(body)' : 'res.send()'}` : ts`
console.log('Unsupported response in ${groupName}.${operationName}', response)
res.status(500)
res.send()`

	return ts`
${each(responses, response => when(!response.isCatchAll, () => ts`
if (response.status === ${String(response.code)}) {
	${responseBody(generatorContext, response, groupName, operationName)}
	res.status(${String(response.code)})
	${responseHeaders(generatorContext, response)}
	${responseContentType(generatorContext, response)}
	${response.defaultContent?.schema ? 'res.send(body)' : 'res.send()'}
	return
}`), '\n')}

${fallthrough}`
}

/**
 * Convert and validate the response body, with a trailing blank line separating
 * it from the response that follows.
 */
function responseBody(generatorContext: CodegenGeneratorContext, response: CodegenResponse, groupName: string, operationName: string): string | Skip {
	const schema = response.defaultContent?.schema
	if (!schema) {
		return SKIP
	}
	const value = isContentJson(response.defaultContent!)
		? `${toResponse(generatorContext, schema, 'v.')}('response', response.body)`
		: 'response.body'

	return ts`
let body: any
try {
	body = ${value}
} catch (error) {
	console.error('Invalid response body in ${groupName}.${operationName}', error)
	res.status(500)
	res.send()
	return
}
`
}

function responseHeaders(generatorContext: CodegenGeneratorContext, response: CodegenResponse): string | Skip {
	return each(response.headers, h =>
		`res.header(${stringLiteral(generatorContext, h.serializedName)}, \`\${response.headers[${stringLiteral(generatorContext, h.name)}]}\`)`, '\n')
}

function responseContentType(generatorContext: CodegenGeneratorContext, response: CodegenResponse): string | Skip {
	const content = response.defaultContent
	if (!content) {
		return SKIP
	}
	return content.mediaType.wildcard
		? 'res.type(response.mediaType)'
		: `res.type(${stringLiteral(generatorContext, content.mediaType.mediaType)})`
}
