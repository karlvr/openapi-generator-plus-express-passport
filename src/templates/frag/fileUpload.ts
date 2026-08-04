import { CodegenOperation, CodegenProperties, CodegenSchemaPurpose, CodegenSchemaType, isCodegenArraySchema, isCodegenObjectLikeSchema } from '@openapi-generator-plus/types'
import { valueSchemaForMetadataSchema } from '@openapi-generator-plus/utils'

/**
 * An interface representing properties for uploading files in a multipart/form-data request.
 */
export interface FileUploadProperty {
	/** Name of the file upload property. */
	name: string
	/** Minimum number of files required if the property takes an array of files. */
	minCount: number | null
	/** Maximum number of files required if the property takes an array of files. */
	maxCount: number | null
	/** Is the file upload property an array of files? */
	isArray: boolean
}

/** The file-upload properties among `properties`, in declaration order. */
export function fileUploadProperties(properties: CodegenProperties | null): FileUploadProperty[] {
	const results: FileUploadProperty[] = []
	if (!properties) {
		return results
	}

	for (const prop in properties) {
		const property = properties[prop]

		if (property.schema.purpose !== CodegenSchemaPurpose.METADATA) {
			continue
		}

		const valueSchema = valueSchemaForMetadataSchema(property.schema)

		if (isCodegenObjectLikeSchema(property.schema) && valueSchema?.schemaType === CodegenSchemaType.FILE) {
			results.push({
				name: prop,
				minCount: null,
				maxCount: 1,
				isArray: false,
			})
		} else if (isCodegenArraySchema(property.schema) && valueSchema?.schemaType === CodegenSchemaType.FILE) {
			results.push({
				name: prop,
				minCount: property.schema.minItems,
				maxCount: property.schema.maxItems,
				isArray: true,
			})
		}
	}

	return results
}

/**
 * Whether any of `operations` has a multipart request body.
 */
export function containsMultipartOperation(operations: CodegenOperation[]): boolean {
	for (const operation of operations) {
		if (operation.requestBody?.defaultContent.mediaType.mimeType.match('^multipart/.*')) {
			return true
		}
	}
	return false
}
