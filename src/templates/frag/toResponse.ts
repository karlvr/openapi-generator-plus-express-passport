import { CodegenGeneratorContext, CodegenSchema, CodegenSchemaType } from '@openapi-generator-plus/types'
import {
	className,
	isArray,
	isBinary,
	isBoolean,
	isDate,
	isDateTime,
	isEnum,
	isInteger,
	isInterface,
	isMap,
	isNumber,
	isObject,
	isOneOf,
	isString,
	isTime,
} from '@openapi-generator-plus/template-utils'

/**
 * A reference to the function that serializes a value of `schema` into the form
 * suitable for a response. `prefix` is the import prefix to use for the
 * validation functions.
 */
export function toResponse(generatorContext: CodegenGeneratorContext, schema: CodegenSchema, prefix: string): string {
	const generator = generatorContext.generator()
	if (isBoolean(schema)) {
		return `${prefix}booleanToResponse`
	} else if (isInteger(schema)) {
		return `${prefix}integerToResponse`
	} else if (isNumber(schema)) {
		return `${prefix}numberToResponse`
	} else if (isString(schema)) {
		return `${prefix}stringToResponse`
	} else if (isBinary(schema)) {
		return `${prefix}binaryToResponse`
	} else if (schema.schemaType === CodegenSchemaType.NULL) {
		return `${prefix}nullToResponse`
	} else if (isObject(schema)) {
		return `${prefix}model${className(generator, schema.nativeType.parentType)}ToResponse`
	} else if (isArray(schema)) {
		return `${prefix}arrayToResponse(${toResponse(generatorContext, schema.component!.schema, prefix)})`
	} else if (isEnum(schema)) {
		return `${prefix}enum${className(generator, schema.nativeType.parentType)}ToResponse`
	} else if (isDate(schema)) {
		return `${prefix}dateToResponse`
	} else if (isDateTime(schema)) {
		return `${prefix}dateTimeToResponse`
	} else if (isTime(schema)) {
		return `${prefix}timeToResponse`
	} else if (isMap(schema)) {
		return `${prefix}mapToResponse(${toResponse(generatorContext, schema.component!.schema, prefix)})`
	} else if (isInterface(schema)) {
		return `${prefix}model${className(generator, schema.nativeType.parentType)}ToResponse`
	} else if (isOneOf(schema)) {
		return `${prefix}oneOf${className(generator, schema.nativeType.parentType)}ToResponse`
	} else {
		return `${prefix}unsupportedToResponse`
	}
}
