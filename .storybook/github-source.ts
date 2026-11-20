// Submodule story roots live in their own repos; GitHub can't browse into a gitlink.
const SUBMODULE_REPOS: Record<string, string> = {
  'packages/datavis/': 'mieweb/datavis',
};

/** GitHub blob URL for a path relative to the ui repo root. */
export function githubSourceUrl(repoPath: string): string {
  const prefix = Object.keys(SUBMODULE_REPOS).find((p) =>
    repoPath.startsWith(p)
  );
  const [repo, path] = prefix
    ? [SUBMODULE_REPOS[prefix], repoPath.slice(prefix.length)]
    : ['mieweb/ui', repoPath];
  return `https://github.com/${repo}/blob/main/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

/** Repo-relative path of an absolute story file path, if it is in a known root. */
export function repoRelativeStoryPath(fileName: string): string | null {
  const roots = [...Object.keys(SUBMODULE_REPOS), 'src/'];
  for (const root of roots) {
    const index = fileName.indexOf(`/${root}`);
    if (index >= 0) return fileName.slice(index + 1);
  }
  return null;
}
