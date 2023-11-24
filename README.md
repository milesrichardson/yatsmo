# JS/TypeScript Frontend Playground

This was generated with `copier`.

This repo uses Node v20 and Yarn v4.

```
nvm use $(cat .nvmrc)
corepack enable
yarn install --immutable

yarn typecheck

# (there aren't any)
yarn test
```

try running the hello world script

```
yarn zx scripts/print-cwd.ts
```

prechecks

```
yarn format.check
yarn check-constraints
```

**Note:** You cannot run `yarn constraints` and must use the wrapper
`yarn check-constraints`, because of a bug with dynamically loading ESM modules
without disabling the V8 compile cache. If you think you know what you're doing,
you can run it directly:

```bash
DISABLE_V8_COMPILE_CACHE=1 yarn constraints
```

And if you think the bug has been fixed, you can skip the check for that
variable and see if the script runs successfully (if it does, please remove the
warning and hacky requirement to disable the compile cache):

```bash
TRY_NOT_DISABLING_V8_COMPILE_CACHE=1 yarn constraints
```
