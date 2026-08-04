import { CodegenEnumSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className } from '@openapi-generator-plus/template-utils'

export function validationEnum(generatorContext: CodegenGeneratorContext, schema: CodegenEnumSchema): string {
	const nativeType = String(schema.nativeType)
	const typeName = className(generatorContext.generator(), nativeType)
	const cases = each(schema.enumValues, value => ts`
if (value === ${value.literalValue}) {
	return ${nativeType}.${value.name}
}`, '\n')

	return ts`
export function enum${typeName}FromRequest(name: string, value: any): ${nativeType} {
	if (typeof value !== 'string' || value === undefined || value === null) {
		throw \`Invalid type for \${name}: expected string got \${typeof value}\`
	}

	${cases}

	throw \`Unexpected enum value for ${nativeType}: \${value}\`
}

export function enum${typeName}ToResponse(name: string, value: ${nativeType}): ${nativeType} {
	if (typeof value !== 'string' || value === undefined || value === null) {
		throw \`Invalid type for \${name}: expected string got \${typeof value}\`
	}

	${cases}

	throw \`Unexpected enum value for ${nativeType}: \${value}\`
}`
}
