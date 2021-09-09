import { CodegenGeneratorConstructor, CodegenGeneratorType, CodegenOperation, isCodegenEnumSchema, isCodegenObjectSchema, isCodegenAnyOfSchema, isCodegenInterfaceSchema, isCodegenOneOfSchema } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates, emit } from '@openapi-generator-plus/handlebars-templates'
import typescriptGenerator, { options as typescriptGeneratorOptions, TypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'
import * as idx from '@openapi-generator-plus/indexed-type'

const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext: TypeScriptGeneratorContext = {
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		defaultNpmOptions: () => ({
			name: 'typescript-express-passport-server',
			version: '0.0.1',
			private: true,
			repository: null,
		}),
		defaultTypeScriptOptions: () => ({
			target: 'ES5',
			libs: ['$target', 'DOM'],
		}),
	}

	const generatorOptions = typescriptGeneratorOptions(config, myContext)

	myContext.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		/* Convert path template from OpenAPI to Express */
		hbs.registerHelper('pathTemplate', function(value: string) {
			return value.replace(/{(.*?)}/g, ':$1')
		})

		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('api', path.join(outputPath, relativeSourceOutputPath, 'api', context.generator().toIdentifier(group.name), 'index.ts'), 
				{ ...rootContext, ...group, ...doc }, true, hbs)
			await emit('apiTypes', path.join(outputPath, relativeSourceOutputPath, 'api', context.generator().toIdentifier(group.name), 'types.ts'), 
				{ ...rootContext, ...group, ...doc }, true, hbs)
			await emit('apiReadme', path.join(outputPath, relativeSourceOutputPath, 'api', context.generator().toIdentifier(group.name), 'README.md'), 
				{ ...rootContext, ...group, ...doc }, true, hbs)

			await emit('apiImpl', path.join(outputPath, relativeSourceOutputPath, 'impl', `${context.generator().toIdentifier(group.name)}.ts`), 
				{ ...rootContext, ...group, ...doc }, false, hbs)
		}

		await emit('models', path.join(outputPath, relativeSourceOutputPath, 'models.ts'), {
			...rootContext,
			...doc,
			schemas: idx.filter(doc.schemas, schema => isCodegenObjectSchema(schema) || isCodegenEnumSchema(schema) || isCodegenOneOfSchema(schema) || isCodegenAnyOfSchema(schema) || isCodegenInterfaceSchema(schema)),
		}, true, hbs)
		await emit('validation', path.join(outputPath, relativeSourceOutputPath, 'validation.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('index', path.join(outputPath, relativeSourceOutputPath, 'index.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('indexTypes', path.join(outputPath, relativeSourceOutputPath, 'types.ts'), { ...rootContext, ...doc }, true, hbs)
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
		postProcessDocument: (doc) => {
			/* Sort operations according to the order we need to declare them */
			doc.groups.forEach(group => {
				group.operations.sort(compareOperations)
			})
		},
		generatorType: () => CodegenGeneratorType.SERVER,
		cleanPathPatterns: () => {
			const result = base.cleanPathPatterns() || []
			const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
			result.push(path.join(relativeSourceOutputPath, 'api', '**'))
			return result
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
