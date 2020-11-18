import { CodegenGeneratorConstructor, CodegenGeneratorType, CodegenOperation } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates, emit } from '@openapi-generator-plus/handlebars-templates'
import typescriptGenerator, { options as typescriptGeneratorOptions, TypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'

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
			name: 'typescript-fetch-api',
			version: '0.0.1',
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
		// await emit('api', path.join(outputPath, relativeSourceOutputPath, 'api.ts'), { ...rootContext, ...doc }, true, hbs)
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

		await emit('models', path.join(outputPath, relativeSourceOutputPath, 'models.ts'), { ...rootContext, ...doc }, true, hbs)
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
				generatorClass: '@openapi-generator-plus/typescript-fetch-client-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.CLIENT,
		cleanPathPatterns: () => {
			const result = base.cleanPathPatterns() || []
			const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
			result.push(path.join(relativeSourceOutputPath, 'api', '**'))
			return result
		},
	}
}

export default createGenerator

