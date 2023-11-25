# YET ANOTHER TYPESCRIPT MONOREPO

This was generated with `copier`. (it actually wasn't, but eventually that's the
intent. I just wanna push it to GitHub in the meantime.)

It's just a bunch of Vite templates for the most part. But they're my Vite
templates. I mean not literally, I didn't make the templates. But I installed
them. And that's something.

Eventually I'm gonna turn this into a GitHub template for creating new frontend
playground projects, and then I'm not gonna touch it for 10 months, and then I'm
gonna have a project idea so I'm gonna clone it but instead of doing the project
I'll get distracted by upgrading everything in this repo.

on that note, the upgrade command is `yarn up -E -i '*'`, you know - assuming
you're a really handsome guy reading this in the future...

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
