import { CodegenGeneratorContext, CodegenSchema } from '@openapi-generator-plus/types'
import {
	className,
	isArray,
	isBinary,
	isBoolean,
	isDate,
	isDateTime,
	isEnum,
	isFile,
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
 * A reference to the function that transforms the serialized request value for
 * `schema` into its JavaScript value. `prefix` is the import prefix to use for
 * the validation functions.
 */
export function fromRequest(generatorContext: CodegenGeneratorContext, schema: CodegenSchema, prefix: string): string {
	const generator = generatorContext.generator()
	if (isBoolean(schema)) {
		return `${prefix}booleanFromRequest`
	} else if (isInteger(schema)) {
		return `${prefix}integerFromRequest`
	} else if (isNumber(schema)) {
		return `${prefix}numberFromRequest`
	} else if (isString(schema)) {
		return `${prefix}stringFromRequest`
	} else if (isBinary(schema)) {
		return `${prefix}binaryFromRequest`
	} else if (isFile(schema)) {
		return `${prefix}fileFromRequest`
	} else if (isObject(schema)) {
		return `${prefix}model${className(generator, schema.nativeType.parentType)}FromRequest`
	} else if (isArray(schema)) {
		const component = schema.component!
		return `${prefix}arrayFromRequest${component.nullable ? 'WithNullable' : ''}(${fromRequest(generatorContext, component.schema, prefix)})`
	} else if (isEnum(schema)) {
		return `${prefix}enum${className(generator, schema.nativeType.parentType)}FromRequest`
	} else if (isDate(schema)) {
		return `${prefix}dateFromRequest`
	} else if (isDateTime(schema)) {
		return `${prefix}dateTimeFromRequest`
	} else if (isTime(schema)) {
		return `${prefix}timeFromRequest`
	} else if (isMap(schema)) {
		return `${prefix}mapFromRequest(${fromRequest(generatorContext, schema.component!.schema, prefix)})`
	} else if (isInterface(schema)) {
		return `${prefix}model${className(generator, schema.nativeType.parentType)}FromRequest`
	} else if (isOneOf(schema)) {
		return `${prefix}oneOf${className(generator, schema.nativeType.parentType)}FromRequest`
	} else {
		return `${prefix}unsupportedFromRequest`
	}
}
