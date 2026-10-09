// Shared helper for spawning a package-manager CLI (npm/pnpm) cross-platform.
//
// On Windows, npm/pnpm resolve to .cmd shims. Node refuses to execFileSync a
// .cmd file without shell:true (CVE-2024-27980 hardening), but execFileSync
// with shell:true + an args array triggers DEP0190 (args are concatenated,
// not escaped). Build a single pre-quoted command string and run it through
// execSync instead, which is the shell-safe idiom Node recommends.
import { execFileSync, execSync } from 'node:child_process';

function quote(arg) {
  return /[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

export function runCmd(cmd, args, opts) {
  if (process.platform === 'win32') {
    execSync([cmd, ...args.map(quote)].join(' '), opts);
  } else {
    execFileSync(cmd, args, opts);
  }
}
