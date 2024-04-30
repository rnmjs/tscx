# TSCX

[![](https://img.shields.io/npm/l/@rnm/tscx.svg)](https://github.com/rnmjs/tscx/blob/main/LICENSE)
[![](https://img.shields.io/npm/v/@rnm/tscx.svg)](https://www.npmjs.com/package/@rnm/tscx)
[![](https://img.shields.io/npm/dm/@rnm/tscx.svg)](https://www.npmjs.com/package/@rnm/tscx)
[![](https://img.shields.io/librariesio/release/npm/@rnm/tscx)](https://www.npmjs.com/package/@rnm/tscx)
[![](https://packagephobia.com/badge?p=@rnm/tscx)](https://packagephobia.com/result?p=@rnm/tscx)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

A `tsc` wrapper with many convenient features. Bring the [nodemon](https://www.npmjs.com/package/nodemon) + JavaScript development experience to TypeScript.

## Highlight

- Same usages as `tsc`.
- Respect `tsconfig.json`.
- ESM.

## Differences with `tsc`

- ✅ Additionally support `--remove` for removing output folder before every compilation.
- ✅ Additionally support `--copyfiles` for copying non-ts files to output folder after every compilation.
- ✅ Additionally support `--script <scr>` for running `npm run <scr>` after compilation success.
- ✅ Additionally support `--exec <path>` for executing js file after compilation success.
- 🚨 [outDir](https://www.typescriptlang.org/tsconfig/#outDir) is required in `tsconfig`.
- 🚨 As for `tsc` built-in options, we only support these options below.
  - `--project`
  - `--watch`

## Install

```sh
npm install typescript @rnm/tscx -D
```

## Usage

```sh
# Equivalent to `npx tsc`
$ npx tscx

# Equivalent to `npx tsc --project tsconfig.build.json --watch`
$ npx tscx --project tsconfig.build.json --watch

# Remove output folder before compilation and then compile ts code.
$ npx tscx --remove

# Compile ts code and then copy non-ts files to output folder after compilation.
$ npx tscx --copyfiles

# Execute `npm run my-script` after compilation success.
$ npx tscx --script my-script

# Compile ts code and execute bootstrap.js after successful compilation.
$ npx tscx --exec bootstrap.js

# Compile ts code in watch mode and execute bootstrap.js after every successful compilation.
$ npx tscx --project tsconfig.build.json --watch --exec bootstrap.js

# Remove => Compile => Copy => npm run => Bootstrap => Edit any file to repeat it
$ npx tscx --project tsconfig.build.json --remove --copyfiles --watch --script my-script --exec bootstrap.js
```

## License

MIT
