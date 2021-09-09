---
"@openapi-generator-plus/typescript-express-passport-server-generator": minor
---

Fix the handling of Dates in JSON

@openapi-generator-plus/typescript-generator-common supports three date approaches:

- native
- string
- `blind-date`

We now support native and string approaches. The default approach is native, and that is what we
previously expected. Note that upstream changed to use strings for dates and times even with the native approach
as Date cannot represent a dates and times.

We now also use regular expressions to check that dates, times and datetimes are sent and received in the correct format.
