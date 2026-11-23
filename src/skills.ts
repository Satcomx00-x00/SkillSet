import { fileURLToPath } from 'node:url';
import { type Exec, exec } from './exec.ts';
import type { Topic } from './schema.ts';

export interface SkillInstallOptions {
  readonly agents: readonly string[];
  readonly skills: readonly string[];
  readonly global: boolean;
  readonly yes: boolean;
  /** Install from a local directory and keep the `skills` CLI off the network (no telemetry). */
  readonly offline: boolean;
}

export interface SkillInstaller {
  /** `from`: a GitHub tree URL or a local topic directory. */
  install(topic: Topic, from: string, opts: SkillInstallOptions): Promise<void>;
}

/** Builds the `skills add` argv (vercel-labs/skills, the cross-agent standard installer). */
export const skillsAddArgs = (from: string, o: SkillInstallOptions): string[] => [
  'add',
  from,
  ...o.agents.flatMap((a) => ['--agent', a]),
  ...o.skills.flatMap((s) => ['--skill', s]),
  ...(o.global ? ['--global'] : []),
  ...(o.yes ? ['--yes'] : []),
  // A local source would be symlinked by default; copy so installs outlive the npx cache.
  ...(o.offline ? ['--copy'] : []),
];

const OFFLINE_ENV = { DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1' } as const;

/**
 * `skills` is a dependency, run with this Node binary. Not `npx skills`: nested under
 * `npx topic-skillset` on Windows, npx leaks `npm_config_package` and grows PATH past
 * cmd.exe's 8191-char limit, both ending in "'skills' is not recognized".
 */
const skillsCli = (): string => fileURLToPath(import.meta.resolve('skills/bin/cli.mjs'));

export const vercelSkills = (run: Exec = exec, cli: () => string = skillsCli): SkillInstaller => ({
  async install(topic, from, opts) {
    const { code } = await run(process.execPath, [cli(), ...skillsAddArgs(from, opts)], {
      shell: false,
      ...(opts.offline && { env: OFFLINE_ENV }),
    });
    if (code !== 0) throw new Error(`skills add failed for topic "${topic.name}" (exit ${code})`);
  },
});
