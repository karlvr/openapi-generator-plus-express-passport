---
"@openapi-generator-plus/typescript-express-passport-server-generator": major
---

Replace the Handlebars templates with TypeScript templates

The generator's templates now live in `src/templates` as TypeScript functions composed from the `ts`
tagged template literal in `@openapi-generator-plus/template-utils`, replacing the `templates`
directory of `.hbs` files. This follows `@openapi-generator-plus/typescript-generator-common` 2.0.0,
which no longer loads Handlebars templates.

The generated output is unchanged, other than the indentation of the closing brace of an unsupported
request-body media type branch, which Handlebars over-indented.

The `customTemplates` config option is no longer supported and logs a warning if it is set.
