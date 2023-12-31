import { $, within, chalk, echo } from "zx";
import { addPrefixToLogs } from "./add-prefix-to-logs.js";
import type { AddPrefixOpts } from "./add-prefix-to-logs.js";
import type { FnWithInjectableOpts } from "./types.js";

/**
 * Callback function from user that can be supplied to a within() block, and
 * which may optionally consume injected functions provided by the withPrefix wrapper.
 */
export type FnWithInjectablePrefixFunctions<T> = FnWithInjectableOpts<
  T,
  {
    /** Function that wraps {@link echo } from Zx to add the provided prefix */
    echo: typeof echo;
    /** Function that wraps some {@link console } methods to add the provided prefix */
    console: Pick<typeof console, "error" | "log" | "warn">;
  }
>;

/**
 * Add prefixes to logs generated by within(), and when calling the provided
 * callback, inject functions for `echo` and `console` that can be called
 * instead of their global counterparts, so that their output is also prefixed.
 * The consumer can choose whether or not to call these functions, or else just
 * use their global variants.
 *
 * (Partially implemented yak shaving of bootleg currying composability, don't
 * look too closely.)
 */
export const withPrefix = <T>(
  fn: FnWithInjectablePrefixFunctions<T>,
  opts?: AddPrefixOpts
) =>
  within(() => {
    const injectablePrefixFunctions = addPrefixToLogs($.log, {
      shouldPrefixLog: opts?.prefix ? () => true : () => false,
      logCd(prefix, entry, _originalLog) {
        console.log(`${prefix}${chalk.green("cd")}`, entry.dir);
      },
      logCmd(prefix, entry, _originalLog) {
        console.log(`${prefix}${chalk.green("$")}`, entry.cmd);
      },
      ...opts,
    });

    $.log = injectablePrefixFunctions.log;

    return fn(injectablePrefixFunctions);
  });
