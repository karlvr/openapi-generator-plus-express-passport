import { CodegenDocument, CodegenOperationGroup } from '@openapi-generator-plus/types'
import { CodegenOptionsTypeScript, TemplateRootContext } from '@openapi-generator-plus/typescript-generator-common'

/**
 * The root context shared by every template in this generator: the
 * typescript-common root context (which already includes the document), plus
 * this generator's options.
 */
export type RootContext = TemplateRootContext & CodegenOptionsTypeScript & {
	generatorClass: string
}

/** A CodegenDocument enriched with the generator's root-context fields. */
export type DocumentContext = CodegenDocument & RootContext

/** The context for the per-group templates: the document context plus the group. */
export type GroupContext = DocumentContext & CodegenOperationGroup & {
	containsMultipartOperation: boolean
}
