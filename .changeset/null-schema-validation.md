---
"@openapi-generator-plus/typescript-express-passport-server-generator": minor
---

Support `null` schemas in the generated validation

A property with a `null` type was converted with `unsupportedFromRequest`, whose `unknown` return
type is not assignable to `null`, so the generated code did not compile. `null` schemas now use the
new `nullFromRequest` and `nullToResponse` functions.
