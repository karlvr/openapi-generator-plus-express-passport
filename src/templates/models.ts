import { ts } from '@openapi-generator-plus/template-utils'
import { CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { DateApproach } from '@openapi-generator-plus/typescript-generator-common'
import { header } from './header'
import { nestedModels } from './nestedModels'
import { DocumentContext } from './types'

const BLIND_DATE_IMPORT = '\n\nimport { LocalDateString, LocalTimeString, LocalDateTimeString, OffsetDateTimeString } from \'blind-date\';'

export function models(generatorContext: CodegenGeneratorContext, ctx: DocumentContext): string {
	return ts`
${header(ctx)}${ctx.dateApproach === DateApproach.BlindDate ? BLIND_DATE_IMPORT : ''}

export namespace Api {
${nestedModels(generatorContext, { schemas: ctx.schemas })}
}
`
}
