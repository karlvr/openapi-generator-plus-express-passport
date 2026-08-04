# TypeScript Express Passport Server API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a TypeScript API server using [Express](http://expressjs.com) and [Passport](https://www.passportjs.org).

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

Once the generator has been run, the generated package can be run using:

```shell
npm install
npm start
```

It will start an API server running on port 3000.

You may also specify a different port:

```shell
npm start -- -p 9000
```

## Config file

The available config file properties are:

### Project layout

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`relativeSourceOutputPath`|`string`|The path to output generated source code, relative to the output path.|`./` or `./src` if `npm` is specified.|

### TypeScript

A `tsconfig.json` file will be output if you specify any of the TypeScript config options.

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`typescript`|`TypeScriptConfig`|Configuration for the `tsconfig.json` file.|`undefined`|

#### `TypeScriptConfig`

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`target`|`string`|The ECMAScript target version.|`ES5`|

### Packaging

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`npm`|`NpmConfig`|Configuration for generating an npm `package.json`|`undefined`|

#### `NpmConfig`

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`name`|`string`|The package name|`typescript-fetch-api`|
|`version`|`string`|The package version|`0.0.1`|
|`repository`|`string`|The URL to the package repository|`undefined`|

## Customising

The templates are TypeScript, in `src/templates`. They are composed from the `ts` tagged template
literal in [`@openapi-generator-plus/template-utils`](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/template-utils),
so customising the output means changing those templates.

The `customTemplates` config file property, which used to point at a directory of Handlebars
overrides, is no longer supported and logs a warning if it is set.
