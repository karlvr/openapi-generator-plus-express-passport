import { CodegenAnyOfSchema, CodegenGeneratorContext, CodegenOneOfSchema, CodegenSchema } from '@openapi-generator-plus/types'
import { ts, each, className } from '@openapi-generator-plus/template-utils'
import { fromRequest } from './frag/fromRequest'
import { toResponse } from './frag/toResponse'
import { nestedValidation } from './nestedValidation'

export function validationOneOf(generatorContext: CodegenGeneratorContext, schema: CodegenOneOfSchema | CodegenAnyOfSchema): string {
	const generator = generatorContext.generator()
	const nativeType = String(schema.nativeType)
	const typeName = className(generator, schema.nativeType.parentType)
	const discriminator = schema.discriminator

	const fromRequestBody = discriminator ? ts`
	const discriminatorValue = value.${discriminator.name}
	switch (value.${discriminator.name}) {
		${each(discriminator.references, ref => ts`
case ${ref.literalValue}:
	return ${fromRequest(generatorContext, ref.schema as CodegenSchema, '')}(name, value)`, '\n')}
	}

	throw \`Invalid value for \${name}: didn't contain a known discriminator value: \${discriminatorValue}\`` : ts`
	const errors: any[] = []
	${each(schema.composes, composed => ts`
try {
	return ${fromRequest(generatorContext, composed, '')}(name, value as ${composed.nativeType})
} catch (error) {
	errors.push(error)
}`, '\n')}

	throw \`Failed to parse request for any member of \${name}: \${errors.join('\\n')}\``

	const toResponseBody = discriminator ? ts`
	const discriminatorValue = value.${discriminator.serializedName}
	switch (discriminatorValue) {
		${each(discriminator.references, ref => ts`
case ${ref.literalValue}:
	return ${toResponse(generatorContext, ref.schema as CodegenSchema, '')}(name, value)`, '\n')}
	}

	throw \`Invalid value for \${name}: didn't contain a known discriminator value: \${discriminatorValue}\`` : ts`
	const errors: any[] = []
	${each(schema.composes, composed => ts`
try {
	return ${toResponse(generatorContext, composed, '')}(name, value as ${composed.nativeType})
} catch (error) {
	errors.push(error)
}`, '\n')}

	throw \`Failed to create response for any member of \${name}: \${errors.join('\\n')}\``

	return ts`
export function oneOf${typeName}FromRequest(name: string, value: any): ${nativeType} {
${fromRequestBody}
}

export function oneOf${typeName}ToResponse(name: string, value: ${nativeType}): ToResponse<${nativeType}> {
${toResponseBody}
}
${nestedValidation(generatorContext, schema)}`
}
