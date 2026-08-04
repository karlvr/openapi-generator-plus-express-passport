import { CodegenGeneratorConstructor, CodegenGeneratorType, CodegenOperation, isCodegenEnumSchema, isCodegenObjectSchema, isCodegenAnyOfSchema, isCodegenInterfaceSchema, isCodegenOneOfSchema, CodegenSchemaType } from '@openapi-generator-plus/types'
import path from 'path'
import { emit } from '@openapi-generator-plus/template-utils'
import typescriptGenerator, { options as typescriptCommonOptions, TypeScriptGeneratorContext, chainTypeScriptGeneratorContext, DateApproach } from '@openapi-generator-plus/typescript-generator-common'
import * as idx from '@openapi-generator-plus/indexed-type'
import {
	api,
	apiImpl,
	apiMultipartHelper,
	apiReadme,
	apiTypes,
	containsMultipartOperation,
	entry,
	indexTypes,
	models,
	packageJson,
	tsconfig,
	validation,
	DocumentContext,
	GroupContext,
} from './templates'

const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext: TypeScriptGeneratorContext = chainTypeScriptGeneratorContext(context, {
		defaultNpmOptions: () => ({
			name: 'typescript-express-passport-server',
			version: '0.0.1',
			private: true,
			repository: null,
		}),
		defaultTypeScriptOptions: () => ({
			target: 'ES2015',
			libs: ['$target', 'DOM'],
		}),
	})

	const generatorOptions = typescriptCommonOptions(config, myContext)

	myContext.templates = {
		package: packageJson,
		tsconfig,
	}

	myContext.exportFiles = async(outputPath, doc, rootContext) => {
		const documentContext = { ...rootContext, ...doc } as DocumentContext
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath

		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}

			const groupContext: GroupContext = {
				...documentContext,
				...group,
				containsMultipartOperation: containsMultipartOperation(operations),
			}
			const groupPath = myContext.generator().toIdentifier(group.name)

			await emit(api(myContext, groupContext), path.join(outputPath, relativeSourceOutputPath, 'api', groupPath, 'index.ts'), true)
			await emit(apiTypes(myContext, groupContext), path.join(outputPath, relativeSourceOutputPath, 'api', groupPath, 'types.ts'), true)
			await emit(apiReadme(myContext, groupContext), path.join(outputPath, relativeSourceOutputPath, 'api', groupPath, 'README.md'), true)

			await emit(apiImpl(myContext, groupContext), path.join(outputPath, relativeSourceOutputPath, 'impl', `${groupPath}.ts`), false)

			if (groupContext.containsMultipartOperation) {
				await emit(apiMultipartHelper(myContext, groupContext), path.join(outputPath, relativeSourceOutputPath, 'impl/helpers', `${groupPath}MultipartHelper.ts`), false)
			}
		}

		const modelsContext: DocumentContext = {
			...documentContext,
			schemas: idx.filter(doc.schemas, schema => isCodegenObjectSchema(schema) || isCodegenEnumSchema(schema) || isCodegenOneOfSchema(schema) || isCodegenAnyOfSchema(schema) || isCodegenInterfaceSchema(schema)),
		}

		await emit(models(myContext, modelsContext), path.join(outputPath, relativeSourceOutputPath, 'models.ts'), true)
		await emit(validation(myContext, documentContext), path.join(outputPath, relativeSourceOutputPath, 'validation.ts'), true)
		await emit(entry(myContext, documentContext), path.join(outputPath, relativeSourceOutputPath, 'index.ts'), true)
		await emit(indexTypes(myContext, documentContext), path.join(outputPath, relativeSourceOutputPath, 'types.ts'), true)
	}

	const base = typescriptGenerator(config, myContext)

	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/typescript-express-passport-server-generator',
			}
		},
		postProcessDocument: (doc, helper) => {
			/* Sort operations according to the order we need to declare them */
			doc.groups.forEach(group => {
				group.operations.sort(compareOperations)
			})

			if (base.postProcessDocument) {
				base.postProcessDocument(doc, helper)
			}
		},
		postProcessSchema: (model, helper) => {
			if (base.postProcessSchema) {
				// HACK: we call the base but _don't_ return its value so we don't remove oneOf and anyOf
				// as we still need to generate validations for them
				base.postProcessSchema(model, helper)
			}
		},
		generatorType: () => CodegenGeneratorType.SERVER,
		cleanPathPatterns: () => {
			const result = base.cleanPathPatterns() || []
			const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
			result.push(path.join(relativeSourceOutputPath, 'api', '**'))
			return result
		},
		toNativeType: (options) => {
			const { schemaType } = options
			if (schemaType === CodegenSchemaType.DATETIME && generatorOptions.dateApproach === DateApproach.Native) {
				// TODO we need to override the default date type in typescript-generator-common which has a serialized type of string
				return new context.NativeType('Date')
			} else if (schemaType === CodegenSchemaType.FILE) {
				return new context.NativeType('Express.Multer.File')
			} else if (schemaType === CodegenSchemaType.BINARY) {
				return new context.NativeType('string | Buffer')
			} else {
				return base.toNativeType(options)
			}
		},
	}
}

/**
 * Compare CodegenOperations so that they are sorted with the most specific paths first,
 * in order to register them in the necessary order with Express.
 * @param a
 * @param b
 */
function compareOperations(a: CodegenOperation, b: CodegenOperation): number {
	const aComponents = a.path.split('/')
	const bComponents = b.path.split('/')

	for (let i = 0; i < aComponents.length; i++) {
		if (i >= bComponents.length) {
			return 1
		}
		const aIsVar = aComponents[i].startsWith('{')
		const bIsVar = bComponents[i].startsWith('{')
		if (aIsVar && !bIsVar) {
			return 1
		} else if (!aIsVar && bIsVar) {
			return -1
		}

		const compared = aComponents[i].localeCompare(bComponents[i])
		if (compared !== 0) {
			return compared
		}
	}

	if (bComponents.length > aComponents.length) {
		return -1
	}
	return 0
}

export default createGenerator
