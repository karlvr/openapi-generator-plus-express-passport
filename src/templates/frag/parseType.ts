import { CodegenGeneratorContext, CodegenParameter } from '@openapi-generator-plus/types'
import {
	className,
	isArray,
	isBoolean,
	isDate,
	isDateTime,
	isEnum,
	isInteger,
	isNumber,
	isObject,
	isString,
	isTime,
} from '@openapi-generator-plus/template-utils'
import { fromRequest } from './fromRequest'

/**
 * A reference to the function that parses the raw input for a parameter, wrapped
 * in `allowUndefined` when the parameter isn't required.
 */
export function parseType(generatorContext: CodegenGeneratorContext, param: CodegenParameter, prefix: string): string {
	const parse = parseFunction(generatorContext, param, prefix)
	return param.required ? parse : `${prefix}allowUndefined(${parse})`
}

function parseFunction(generatorContext: CodegenGeneratorContext, param: CodegenParameter, prefix: string): string {
	const generator = generatorContext.generator()
	if (isBoolean(param)) {
		return `${prefix}parseBoolean`
	} else if (isInteger(param)) {
		return `${prefix}parseInteger`
	} else if (isNumber(param)) {
		return `${prefix}parseNumber`
	} else if (isString(param)) {
		return `${prefix}parseString`
	} else if (isDate(param)) {
		return `${prefix}parseDate`
	} else if (isTime(param)) {
		return `${prefix}parseTime`
	} else if (isDateTime(param)) {
		return `${prefix}parseDateTime`
	} else if (isObject(param)) {
		return `${prefix}model${className(generator, param.nativeType)}FromRequest`
	} else if (isArray(param)) {
		const component = param.schema.component!
		return `${prefix}arrayFromRequest${component.nullable ? 'WithNullable' : ''}(${fromRequest(generatorContext, component.schema, prefix)})`
	} else if (isEnum(param)) {
		return `${prefix}enum${className(generator, param.nativeType)}FromRequest`
	} else {
		return `${prefix}parseUnsupported`
	}
}
