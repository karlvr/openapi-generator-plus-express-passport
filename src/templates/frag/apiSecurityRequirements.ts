import { CodegenGeneratorContext, CodegenOperation, CodegenSecurityScheme } from '@openapi-generator-plus/types'
import { ts, each, stringLiteral, Skip, SKIP } from '@openapi-generator-plus/template-utils'

const X_SESSION = 'x-session'

/**
 * Render the `passport.authenticate(…)` middleware for each scheme of each of
 * the operation's security requirements.
 */
export function apiSecurityRequirements(generatorContext: CodegenGeneratorContext, operation: CodegenOperation): string | Skip {
	const securityRequirements = operation.securityRequirements
	if (!securityRequirements) {
		return SKIP
	}
	return each(securityRequirements.requirements, (requirement) => {
		return each(requirement.schemes, ({ scheme }) => renderScheme(generatorContext, scheme), '\n')
	}, '\n')
}

function renderScheme(generatorContext: CodegenGeneratorContext, scheme: CodegenSecurityScheme): string {
	return ts`
passport.authenticate(
	${stringLiteral(generatorContext, scheme.name)},
	{
${sessionOptions(scheme)}
	}
),`
}

function sessionOptions(scheme: CodegenSecurityScheme): string | Skip {
	const xSession = scheme.vendorExtensions?.[X_SESSION]
	if (xSession !== undefined) {
		return `		session: ${String(xSession)},`
	} else if (scheme.scheme === 'bearer') {
		return ts`
		/* Bearer auth scheme doesn't require sessions */
		session: false,`
	} else if (scheme.type === 'apiKey') {
		return ts`
		/* API key auth scheme doesn't require sessions */
		session: false,`
	} else {
		return SKIP
	}
}
