# TSCX

[![](https://img.shields.io/npm/l/@rnm/tscx.svg)](https://github.com/rnmjs/tscx/blob/main/LICENSE)
[![](https://img.shields.io/npm/v/@rnm/tscx.svg)](https://www.npmjs.com/package/@rnm/tscx)
[![](https://img.shields.io/npm/dm/@rnm/tscx.svg)](https://www.npmjs.com/package/@rnm/tscx)
[![](https://img.shields.io/librariesio/release/npm/@rnm/tscx)](https://www.npmjs.com/package/@rnm/tscx)
[![](https://packagephobia.com/badge?p=@rnm/tscx)](https://packagephobia.com/result?p=@rnm/tscx)

A `tsc` wrapper with many convenient features. Bring the [nodemon](https://www.npmjs.com/package/nodemon) + JavaScript development experience to TypeScript.

## Background

When we are using JavaScript, we usually run `nodemon main.js`. Then, application will automatically restart when js file changes. It's a great development experience. Why can't TypeScript? The reason is the compilation (tsc). Because of this, some edge cases are inconvenient just using `tsc`. For example:

- Remove the output folder before compilation started
- Copy non-ts files to output folder after compilation finished
- Execute app entrance file immediately once compilation finished
- Watch source files, repeat steps above and restart the app

Now you can run one line of command to solve the problems. Better development experience!

```sh
npx tscx --project tsconfig.build.json --remove --copyfiles --watch --exec bootstrap.js
```

Happy hacking!

## Highlight

- Same usages as `tsc`.
- Respect `tsconfig.json`.
- ESM.

## Differences with `tsc`

- ✅ Support option `--remove` for removing output folder before every compilation.
- ✅ Support option `--copyfiles` for copying non-ts files to output folder after every compilation.
- ✅ Support option `--script <scr>` for running `npm run <scr>` after compilation success.
- ✅ Support option `--exec <path>` for executing js file after compilation success.
- ❌ As for `tsc` built-in options, we only support options below.
  - `--project`
  - `--watch`

## Install

```sh
npm install typescript @nrm/tscx -D
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

# Compile ts code and execute bootstrap.js after successful compilation.
$ npx tscx --exec bootstrap.js

# Compile ts code in watch mode and execute bootstrap.js after every successful compilation.
$ npx tscx --project tsconfig.build.json --watch --exec bootstrap.js

# Remove => Compile => Copy => Execute => Edit any file to repeat it
$ npx tscx --project tsconfig.build.json --remove --copyfiles --watch --exec bootstrap.js
```

## License

MIT
