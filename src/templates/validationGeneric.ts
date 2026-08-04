import { CodegenGeneratorContext, CodegenInterfaceSchema, CodegenObjectSchema, CodegenProperty, CodegenSchemaPurpose } from '@openapi-generator-plus/types'
import { ts, each, when, className, constantName, stringLiteral, Skip } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { fromRequest } from './frag/fromRequest'
import { toResponse } from './frag/toResponse'
import { nestedValidation } from './nestedValidation'

type ValidatableSchema = CodegenObjectSchema | CodegenInterfaceSchema

export function validationGeneric(generatorContext: CodegenGeneratorContext, schema: ValidatableSchema): string {
	const generator = generatorContext.generator()
	const isMetadata = schema.purpose === CodegenSchemaPurpose.METADATA
	const nativeType = String(schema.nativeType)
	const typeName = className(generator, schema.nativeType.parentType)
	const keysConstant = constantName(generator, `${nativeType}Keys`)
	const contentType = schema.discriminator
		? `Omit<${schema.nativeType.parentType}, ${stringLiteral(generatorContext, schema.discriminator.serializedName)}>`
		: nativeType

	return ts`
${when(!isMetadata, () => `const ${keysConstant}: string[] = [${each(schema.properties, p => stringLiteral(generatorContext, p.serializedName), ', ')}]\n`)}
function model${typeName}FromRequestContent(name: string, value: any, knownKeys: Record<string, boolean> = {}): ${contentType} {
${isMetadata ? metadataFromRequestContent(generatorContext, schema, nativeType) : objectFromRequestContent(generatorContext, schema, keysConstant, contentType)}

	return result
}

function model${typeName}ToResponseContent(name: string, value: ${nativeType}, knownKeys: Record<string, boolean> = {}): ToResponse<${contentType}> {
${isMetadata ? '	throw \'toResponse not supported for metadata schemas\'' : objectToResponseContent(generatorContext, schema, keysConstant, contentType)}
}

export function model${typeName}FromRequest(name: string, value: any): ${nativeType} {
${dispatch(generatorContext, schema, {
	nativeType,
	typeName,
	direction: 'FromRequest',
	reference: referenced => fromRequest(generatorContext, referenced, ''),
	resultType: nativeType,
})}
}

export function model${typeName}ToResponse(name: string, value: ${nativeType}): ToResponse<${nativeType}> {
${dispatch(generatorContext, schema, {
	nativeType,
	typeName,
	direction: 'ToResponse',
	reference: referenced => toResponse(generatorContext, referenced, ''),
	resultType: `ToResponse<${nativeType}>`,
})}
}
${nestedValidation(generatorContext, schema)}`
}

/**
 * The body of the content function for a metadata schema, which reads its single
 * `value` property from the request value itself rather than from a member.
 */
function metadataFromRequestContent(generatorContext: CodegenGeneratorContext, schema: ValidatableSchema, nativeType: string): string {
	const property = schema.properties ? idx.get(schema.properties, 'value') : undefined
	return ts`
	const result: ${nativeType} = {
	${when(property && !property.readOnly, () => propertyValue(generatorContext, property!, 'value'))}
	}`
}

function objectFromRequestContent(generatorContext: CodegenGeneratorContext, schema: ValidatableSchema, keysConstant: string, contentType: string): string {
	const parents: ValidatableSchema[] = schema.parents ?? []
	return ts`
	if (typeof value !== 'object' || value === undefined || value === null) {
		throw \`Invalid type for \${name}: expected object got \${typeof value}\`
	}

	${keysConstant}.forEach(k => knownKeys[k] = true)

	const result: ${contentType} = {
	${each(parents, parent => `	...${fromRequest(generatorContext, parent, '')}Content(name, value, knownKeys),`, '\n')}
	${each(schema.properties, property => when(!property.readOnly, () => propertyValue(generatorContext, property, 'member')), '\n')}
	${discriminatorValues(generatorContext, schema)}
	}`
}

function objectToResponseContent(generatorContext: CodegenGeneratorContext, schema: ValidatableSchema, keysConstant: string, contentType: string): string {
	const parents: ValidatableSchema[] = schema.parents ?? []
	return ts`
	if (typeof value !== 'object' || value === undefined || value === null) {
		throw \`Invalid type for \${name}: expected object got \${typeof value}\`
	}

	${keysConstant}.forEach(k => knownKeys[k] = true)

	const result: ToResponse<${contentType}> = {
	${each(parents, parent => `	...${toResponse(generatorContext, parent, '')}Content(name, value as unknown as ${parent.nativeType}, knownKeys),`, '\n')}
	${each(schema.properties, property => when(!property.writeOnly, () => propertyValue(generatorContext, property, 'member', true)), '\n')}
	${discriminatorValues(generatorContext, schema)}
	}

	return result`
}

/**
 * A property entry in the object literal, wrapped in the nullability handler
 * appropriate to the property.
 */
function propertyValue(generatorContext: CodegenGeneratorContext, property: CodegenProperty, source: 'value' | 'member', response = false): string {
	const conversion = response
		? toResponse(generatorContext, property.schema, '')
		: fromRequest(generatorContext, property.schema, '')
	const wrapped = property.required
		? (property.nullable ? `allowNull(${conversion})` : conversion)
		: (property.nullable ? `allowNullOrUndefined(${conversion})` : `allowUndefined(${conversion})`)
	const key = stringLiteral(generatorContext, property.serializedName)
	const from = source === 'value' ? 'value' : `value[${key}]`
	return `	${key}: ${wrapped}(\`\${name}.${property.serializedName}\`, ${from}),`
}

function discriminatorValues(generatorContext: CodegenGeneratorContext, schema: ValidatableSchema): string | Skip {
	return each(schema.discriminatorValues, dv =>
		`	${stringLiteral(generatorContext, dv.schema.discriminator?.serializedName ?? '')}: ${dv.literalValue},`, '\n')
}

interface DispatchOptions {
	nativeType: string
	typeName: string
	direction: 'FromRequest' | 'ToResponse'
	reference: (referenced: Parameters<typeof fromRequest>[1]) => string
	resultType: string
}

/**
 * The body of the exported conversion function: either a switch over the
 * discriminator, or a call to the content function plus the unknown-key check.
 */
function dispatch(generatorContext: CodegenGeneratorContext, schema: ValidatableSchema, options: DispatchOptions): string {
	const { nativeType, typeName, direction, reference, resultType } = options

	if (schema.discriminator) {
		return ts`
	const discriminatorValue = value.${schema.discriminator.serializedName}
	switch (discriminatorValue) {
		${each(schema.discriminator.references, ref => ts`
case ${ref.literalValue}:
	return ${reference(ref.schema)}(name, value)`, '\n')}
	}

	throw \`Invalid value for \${name}: didn't contain a known discriminator value: \${discriminatorValue}\``
	}

	return ts`
	const knownKeys: Record<string, boolean> = {}
	const result: ${resultType} = model${typeName}${direction}Content(name, value, knownKeys)

	/* Known keys */
	if (__options?.failOnUnknownProperties) {
		for (const key of Object.keys(value)) {
			if (!knownKeys[key]) {
				throw \`Unexpected key in ${nativeType}: \${key}\`
			}
		}
	}

	return result`
}
