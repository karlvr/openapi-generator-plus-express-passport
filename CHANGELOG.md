# @openapi-generator-plus/typescript-express-passport-server-generator

## 2.3.0

### Minor Changes

- ba395fd: Upgrade to latest core and pass all tests

## 2.2.3

### Patch Changes

- Fix date validation to accept ISO8601 timezones without colon separator

## 2.2.2

### Patch Changes

- 59ea543: Fix datetime and time regex to allow any number of digits for milliseconds

## 2.2.1

### Patch Changes

- e675db3: Fix missing use of serializedName in the known keys for an object
- 5d29760: Use a native return type instead of any for enum...ToJson functions
- 5efb295: Fix return type on oneOf...ToJson validation functions

## 2.2.0

### Minor Changes

- d82c4b1: Support readOnly and writeOnly

## 2.1.1

### Patch Changes

- aec96f1: Fix use of serializedName for parameters

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
