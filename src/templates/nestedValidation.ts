import {
	CodegenGeneratorContext,
	CodegenLogLevel,
	CodegenSchemas,
	isCodegenAnyOfSchema,
	isCodegenEnumSchema,
	isCodegenInterfaceSchema,
	isCodegenObjectSchema,
	isCodegenOneOfSchema,
} from '@openapi-generator-plus/types'
import { each, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { validationEnum } from './validationEnum'
import { validationGeneric } from './validationGeneric'
import { validationOneOf } from './validationOneOf'

/**
 * The conversion functions for the schemas in `scope`, each separated from what
 * precedes it by a blank line.
 */
export function nestedValidation(generatorContext: CodegenGeneratorContext, scope: { schemas: CodegenSchemas | null }): string | Skip {
	if (!scope.schemas) {
		return SKIP
	}
	return each(idx.allValues(scope.schemas), schema => {
		if (isCodegenEnumSchema(schema)) {
			return `\n${validationEnum(generatorContext, schema)}`
		} else if (isCodegenObjectSchema(schema)) {
			return `\n${validationGeneric(generatorContext, schema)}`
		} else if (isCodegenOneOfSchema(schema) || isCodegenAnyOfSchema(schema)) {
			return `\n${validationOneOf(generatorContext, schema)}`
		} else if (isCodegenInterfaceSchema(schema)) {
			return `\n${validationGeneric(generatorContext, schema)}`
		} else {
			generatorContext.log(CodegenLogLevel.WARN, `Unsupported schema type: ${schema.schemaType}`)
			return '\n'
		}
	}, '\n')
}
