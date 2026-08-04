---
"@openapi-generator-plus/typescript-express-passport-server-generator": patch
---

Fix generated body validation throwing "Invalid request content type" when a request has no body and `requestBody.required` is `false`.
