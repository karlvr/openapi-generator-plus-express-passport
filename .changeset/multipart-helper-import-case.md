---
"@openapi-generator-plus/typescript-express-passport-server-generator": patch
---

Fix the case of the multipart helper import

The multipart helper is written to `impl/helpers/<identifier>MultipartHelper.ts`, but the API and
implementation files imported it by lower-casing the group name. For a group whose identifier is not
all lower-case, such as `fileUploads`, the import did not resolve on a case-sensitive filesystem.
Both imports now use the group identifier, matching the emitted filename.
