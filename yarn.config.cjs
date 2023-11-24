// Require that the user run with compile cache disabled to workaround a bug
(() => {
  const compileCacheDisabled = process.env.DISABLE_V8_COMPILE_CACHE === "1";
  const tryNotDisabling =
    process.env.TRY_NOT_DISABLING_V8_COMPILE_CACHE === "1";
  if (!compileCacheDisabled && !tryNotDisabling) {
    console.error(`
FATAL: DISABLE_V8_COMPILE_CACHE=1 is required to run this script because of
a bug in the compile cache that causes dynamic imports of ESM modules to fail.

  Try running:

        DISABLE_V8_COMPILE_CACHE=1 yarn constraints

  Or, if you think the bug has been fixed, you can opt out:

        TRY_NOT_DISABLING_V8_COMPILE_CACHE=1 yarn constraints

  Or, if you are calling yarn constraints directly, you should use the script instead:

        yarn check-constraints
`);
    process.exit(1);
  } else if (tryNotDisabling) {
    console.warn(`
Ok, trying to run even without setting DISABLE_V8_COMPILE_CACHE=1 ...

  If this script runs successfully, please update yarn.config.js to remove
  the requirement for disabling the cache, as the bug must have been fixed.

  If you get an error like "invalid host defined options" or "a dynamic import
  callback was not specified," then the bug is still present. Disable the cache.
`);
  }
})();

/*** @typedef { import('@yarnpkg/types').Yarn.Constraints.Context } Context */
/*** @typedef { import('@yarnpkg/types').Yarn.Constraints.Dependency } Dependency */
/*** @typedef { import('@yarnpkg/types').Yarn.Constraints.Context } Dependency */
/*** @typedef { import('@yarnpkg/types').Yarn.Config["constraints"] } EnforcementFunction */
/*** @typedef { "exec" | "file" | "git" | "link" | "npm" | "patch" | "portal" | "workspace" } Protocol */
const { defineConfig } = require("@yarnpkg/types");

// is-exact-version is an ESM module, so we need to import it dynamically,
// which also unfortunately requires the hacky DISABLE_V8_COMPILE_CACHE=1
function loadIsExactVersion() {
  return new Promise((resolve, reject) => {
    import("is-exact-version")
      .then((module) => {
        resolve(module.isExactVersion);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Sometimes the function from the module can throw an error, but we just want it
// to return false in that case rather than crashing the script entirely
const loadSafeIsExactVersion = async () => {
  // Sometimes the function can throw (if it got a range for example)
  const isExactVersionFromModule = await loadIsExactVersion();
  // But we want our wrapper function to simply return false
  /*** @type { (npmRange: string, dependency: Dependency) => boolean } _ */
  return (npmRange, dependency) => {
    try {
      return isExactVersionFromModule(npmRange);
    } catch {
      console.warn(
        `WARN [${dependency.ident} ${dependency.range}]: isExactVersion threw`
      );
      return false;
    }
  };
};

/**
 * @type { EnforcementFunction }
 */
async function enforceExactReferencesNoSemverRangesAllowed({ Yarn }) {
  const isExactVersion = await loadSafeIsExactVersion();
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === `peerDependencies`) {
      continue;
    }

    // Only enforce exact references for npm dependencies
    // (git: protocol actually can specify semver range, but we just don't care)
    const npmRange = getNpmRangeOrNull(dependency);
    if (npmRange === null) {
      continue;
    }

    if (!isExactVersion(npmRange)) {
      const maybeResolvedVersion = dependency.resolution?.version;
      if (typeof maybeResolvedVersion === "string") {
        dependency.update(maybeResolvedVersion);
      } else {
        dependency.error(
          [
            `Invalid field ${dependency.type}["${dependency.ident}"]. `,
            `Expected exact version, but got semver range.`,
            `Not fixable because there is no resolved version.`,
            `Fix with either:`,
            `    yarn install && yarn constraints --fix`,
            `or`,
            `    yarn ${
              dependency.workspace
                ? `workspace ${dependency.workspace.ident} `
                : ""
            }add -E ${dependency.type === "devDependencies" ? "--dev" : ""} ${
              dependency.ident
            }`,
          ].join("\n")
        );
      }
    }
  }
  return Promise.resolve();
}

/*** @type { (dependency: Dependency) => Protocol } */
const guessProtocol = (dependency) => {
  if (dependency.range.startsWith("exec:")) {
    return "exec";
  } else if (dependency.range.startsWith("file:")) {
    return "file";
  } else if (dependency.range.startsWith("git@")) {
    return "git";
  } else if (dependency.range.startsWith("link:")) {
    return "link";
  } else if (dependency.range.startsWith("patch:")) {
    return "patch";
  } else if (dependency.range.startsWith("portal:")) {
    return "portal";
  } else if (dependency.range.startsWith("workspace:")) {
    return "workspace";
  } else {
    return "npm";
  }
};

/*** @type { (dependency: Dependency) => string } */
const getNpmRangeOrNull = (dependency) => {
  if (guessProtocol(dependency) === "npm") {
    if (dependency.range.startsWith("npm:")) {
      // drop the npm: protocol if the user chose to include it (which is valid)
      return dependency.range.slice(4);
    } else {
      return dependency.range;
    }
  } else {
    return null;
  }
};

/**
 * This rule will enforce that a workspace MUST depend on the same version of
 * a dependency as the one used by the other workspaces.
 *
 * @type { EnforcementFunction }
 */
function enforceConsistentDependenciesAcrossTheProject({ Yarn }) {
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === `peerDependencies`) {
      continue;
    }

    for (const otherDependency of Yarn.dependencies({
      ident: dependency.ident,
    })) {
      if (otherDependency.type === `peerDependencies`) {
        continue;
      }

      dependency.update(otherDependency.range);
    }
  }
  return Promise.resolve();
}

module.exports = defineConfig({
  constraints: async (ctx) => {
    await enforceExactReferencesNoSemverRangesAllowed(ctx);
    await enforceConsistentDependenciesAcrossTheProject(ctx);
  },
});
