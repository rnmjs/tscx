# TSCX

[![](https://img.shields.io/npm/l/@rnm/tscx.svg)](https://github.com/rnmjs/tscx/blob/main/LICENSE)
[![](https://img.shields.io/npm/v/@rnm/tscx.svg)](https://www.npmjs.com/package/@rnm/tscx)
[![](https://img.shields.io/npm/dm/@rnm/tscx.svg)](https://www.npmjs.com/package/@rnm/tscx)
[![](https://packagephobia.com/badge?p=@rnm/tscx)](https://packagephobia.com/result?p=@rnm/tscx)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/rnmjs/tscx?tab=readme-ov-file#contributing)

A `tsc` wrapper with many convenient options. Bring the [nodemon](https://www.npmjs.com/package/nodemon) + JavaScript development experience to TypeScript.

## Why

Developing a backend application using TypeScript needs some other third-party library. It's tedious and hard to config 🤦‍♂️.

```json
{
  "scripts": {
    "clean": "rimraf dist",
    "compile": "tsc -p tsconfig.build.json",
    "copy-files": "copyfiles -u 1 src/**/*.njk dist",
    "build": "npm run clean && npm run compile && npm run copy-files",
    "dev": "NODE_ENV=local nodemon -w src -e ts --exec 'npm run build && node bootstrap.js'"
  },
  "devDependencies": {
    "copyfiles": "2.4.1",
    "nodemon": "3.1.0",
    "rimraf": "5.0.5",
    "typescript": "5.6.3"
  }
}
```

Now you can simplify your `package.json` by using this library 😄.

```json
{
  "scripts": {
    "dev": "NODE_ENV=local tscx -rwc -p tsconfig.build.json -e bootstrap.js"
  },
  "devDependencies": {
    "@rnm/tscx": "*",
    "typescript": "5.6.3"
  }
}
```

## Highlight

- Same usages as `tsc`.
- Respect `tsconfig.json`.
- ESM.

## Differences with `tsc`

- ✅ Additionally support `--remove` for removing output folder before every compilation.
- ✅ Additionally support `--copyfiles` for copying non-ts and non-js files to output folder after every compilation.
- ✅ Additionally support `--exec <path>` for executing js file after compilation success.
- ✅ Additionally support `--exclude <patterns...>` for excluding files from compilation. Inspired by [this issue](https://github.com/microsoft/TypeScript/issues/46005).
- ✅ Additionally support `--include <patterns...>` for including files in compilation.
- 🚨 [outDir](https://www.typescriptlang.org/tsconfig/#outDir) is required in `tsconfig` if you are using `--remove`, `--copyfiles` or `--watch`.

## Install

```sh
npm install typescript @rnm/tscx -D
```

## Usage

```sh
# Equivalent to `npx tsc`
$ npx tscx

# Equivalent to `npx tsc --noEmit`
$ npx tscx --noEmit

# Equivalent to `npx tsc --project tsconfig.build.json --watch`
$ npx tscx --project tsconfig.build.json --watch

# Remove output folder before compilation and then compile ts code.
$ npx tscx --remove

# Compile ts code and then copy non-ts files to output folder after compilation.
$ npx tscx --copyfiles

# Compile ts code and execute bootstrap.js after successful compilation.
$ npx tscx --exec bootstrap.js

# Compile ts code in watch mode and execute bootstrap.js after every successful compilation.
$ npx tscx --project tsconfig.build.json --watch --exec bootstrap.js

# Remove => Compile => Copy => Bootstrap => Edit any file to repeat it
$ npx tscx --project tsconfig.build.json --remove --copyfiles --watch --exec bootstrap.js
```

## Contributing

- Clone this repository.
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`.
- Install dependencies using `pnpm install`.
- Run `pnpm build` to build and `pnpm test` to test.

## License

MIT
