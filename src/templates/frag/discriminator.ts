import { CodegenObjectSchema } from '@openapi-generator-plus/types'
import { ts } from '@openapi-generator-plus/template-utils'

/**
 * The discriminator-bearing fields of an object-like schema. Object and
 * interface schemas both satisfy this.
 */
export type DiscriminatorSchema = Pick<CodegenObjectSchema, 'discriminator' | 'discriminatorValues'>

export function discriminator(schema: DiscriminatorSchema): string {
	const parts: string[] = []
	if (schema.discriminator) {
		parts.push(ts`
	/**
	 * Discriminator property
	 */
	${schema.discriminator.serializedName}: ${schema.discriminator.nativeType.serializedType};
`)
	}
	if (schema.discriminatorValues) {
		for (const dv of schema.discriminatorValues) {
			parts.push(ts`
	/**
	 * Value for discriminator in ${dv.schema.nativeType.parentType}
	 */
	${dv.schema.discriminator?.serializedName ?? ''}: ${dv.literalValue};
`)
		}
	}
	return parts.join('\n')
}
