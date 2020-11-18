import { CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
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
			await emit('api', path.join(outputPath, relativeSourceOutputPath, context.generator().toIdentifier(group.name), 'index.ts'), 
				{ ...rootContext, ...group, ...doc }, true, hbs)
			await emit('apiTypes', path.join(outputPath, relativeSourceOutputPath, context.generator().toIdentifier(group.name), 'types.ts'), 
				{ ...rootContext, ...group, ...doc }, true, hbs)
			await emit('apiImpl', path.join(outputPath, relativeSourceOutputPath, context.generator().toIdentifier(group.name), 'example.ts'), 
				{ ...rootContext, ...group, ...doc }, true, hbs)
		}

		await emit('models', path.join(outputPath, relativeSourceOutputPath, 'models.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('validation', path.join(outputPath, relativeSourceOutputPath, 'validation.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('index', path.join(outputPath, relativeSourceOutputPath, 'index.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('indexTypes', path.join(outputPath, relativeSourceOutputPath, 'types.ts'), { ...rootContext, ...doc }, true, hbs)
		// await emit('runtime', path.join(outputPath, relativeSourceOutputPath, 'runtime.ts'), { ...rootContext, ...doc }, true, hbs)
		// await emit('configuration', path.join(outputPath, relativeSourceOutputPath, 'configuration.ts'), { ...rootContext, ...doc }, true, hbs)
		// await emit('custom.d', path.join(outputPath, relativeSourceOutputPath, 'custom.d.ts'), { ...rootContext, ...doc }, true, hbs)
		// await emit('index', path.join(outputPath, relativeSourceOutputPath, 'index.ts'), { ...rootContext, ...doc }, true, hbs)
		// await emit('README', path.join(outputPath, 'README.md'), { ...rootContext, ...doc }, true, hbs)
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
	}
}

export default createGenerator

