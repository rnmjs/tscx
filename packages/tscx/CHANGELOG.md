# @rnm/tscx

## 0.3.9

### Patch Changes

- 637ee2f: feat: support `--exclude` option

## 0.3.8

### Patch Changes

- 6f760a5: feat: use built-in tsc path when it's fail to resolve tsc path in current directory

## 0.3.7

### Patch Changes

- 0c46638: fix: fix --remove and --copyfiles options not working

## 0.3.6

### Patch Changes

- e6303fd: feat: allow absent `--outDir` in some situations

## 0.3.5

### Patch Changes

- e23eefa: fix: disallow using `--copyfiles` and `--noEmit` at the same time

## 0.3.4

### Patch Changes

- 72935d9: perf: add `files` field to package.json to decrease package size

## 0.3.3

### Patch Changes

- 450546d: fix: crash

## 0.3.2

### Patch Changes

- 747915b: fix: correctly resolve tsc path
- 3f0f512: fix: not be killed (using ctrl + c) when the task queue is still running

## 0.3.1

### Patch Changes

- 0da49b8: fix: print correct version when passing `--version`
- 9be3a2a: fix: remove incorrect default
- 95c6af9: fix: do not watch the tsconfig.json file

## 0.3.0

### Minor Changes

- 23de386: refactor!: re-write it. drop `--script` option support

## 0.2.0

### Minor Changes

- 2c7a5da: feat: allow all options that are allowed in `tsc`

### Patch Changes

- 2eb0e2c: fix: dont't copy files in `.git` folder

## 0.1.5

### Patch Changes

- 5b962c7: feat: support built-in `--noCheck` options

## 0.1.4

### Patch Changes

- f38dcb7: chore: upgrade deps

## 0.1.3

### Patch Changes

- a8e23c0: fix: the value of --project option can be a dir

## 0.1.2

### Patch Changes

- bd20506: feat: support `--script` option

## 0.1.1

### Patch Changes

- aab20fb: fix: fix possible EventEmitter memory leak

## 0.1.0

### Minor Changes

- 0a2f8df: fix: fix copyfiles error

## 0.0.6

### Patch Changes

- 9e11956: chore: bump version

## 0.0.5

### Patch Changes

- b6ea97e: fix: improve stability when update tsconfig

## 0.0.4

### Patch Changes

- 5aa7742: fix: npm compatibility

## 0.0.3

### Patch Changes

- 406a552: fix: fix bin importation

## 0.0.2

### Patch Changes

- 1eb9fb3: fix: fix bin module, use cjs

## 0.0.1

### Patch Changes

- ca8c9b0: feat: init
