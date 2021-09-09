# @openapi-generator-plus/typescript-express-passport-server-generator

## 2.1.0

### Minor Changes

- 982af57: Fix the handling of Dates in JSON

  @openapi-generator-plus/typescript-generator-common supports three date approaches:

  - native
  - string
  - `blind-date`

  We now support native and string approaches. The default approach is native, and that is what we
  previously expected. Note that upstream changed to use strings for dates and times even with the native approach
  as Date cannot represent a dates and times.

  We now also use regular expressions to check that dates, times and datetimes are sent and received in the correct format.

### Patch Changes

- 3913343: Fix validation of arrays
- 812216c: Fix not using serializedName for properties
- 9623f72: Fix security requirements

## 2.0.0

### Major Changes

- fad44e6: Upgrade to latest openapi-generator-plus

  This includes improved support for the `oneOf` construct, and strong type checking of the generated code.
