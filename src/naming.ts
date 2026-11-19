/**
 * Skill naming: `skillset-<source>-<skill>` (Agent Skills names allow only [a-z0-9-], so this is the
 * spec-compliant spelling of `skillset:<source>:<skill>`). Custom skills omit the source.
 */
export const BRAND = 'skillset';
const P = `${BRAND}-`;

export const qualify = (skill: string, source?: string): string =>
  !source || skill === source || skill.startsWith(`${source}-`)
    ? `${P}${skill}`
    : `${P}${source}-${skill}`;

export const isQualified = (name: string): boolean => name.startsWith(P);

/** Default import source: the repo owner, kebab-cased (`mattpocock/skills` → `mattpocock`). */
export const sourceOf = (repo: string): string =>
  (repo.split('/')[0] ?? repo)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Rewrites `/old` slash commands to their new names. Prose and code spans are untouched: a bare
 * name there often means something else (e.g. the `rust-anything` CLI vs the skill).
 */
export const rewriteRefs = (text: string, renames: ReadonlyMap<string, string>): string =>
  [...renames]
    .filter(([from, to]) => from !== to)
    .sort(([a], [b]) => b.length - a.length)
    .reduce(
      (t, [from, to]) =>
        t.replace(new RegExp(`(?<=(?:^|[^\\w/.-])/)${esc(from)}(?![\\w-])`, 'g'), to),
      text,
    );
