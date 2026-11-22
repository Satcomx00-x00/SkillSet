import { fileURLToPath } from 'node:url';
import { type Exec, exec } from './exec.ts';
import { treeUrl } from './github.ts';
import type { Topic } from './schema.ts';

export interface SkillInstallOptions {
  readonly agents: readonly string[];
  readonly skills: readonly string[];
  readonly global: boolean;
  readonly yes: boolean;
}

export interface SkillInstaller {
  install(topic: Topic, opts: SkillInstallOptions): Promise<void>;
}

/** Builds the `skills add` argv (vercel-labs/skills, the cross-agent standard installer). */
export const skillsAddArgs = (topic: Topic, o: SkillInstallOptions): string[] => [
  'add',
  treeUrl(topic),
  ...o.agents.flatMap((a) => ['--agent', a]),
  ...o.skills.flatMap((s) => ['--skill', s]),
  ...(o.global ? ['--global'] : []),
  ...(o.yes ? ['--yes'] : []),
];

/**
 * `skills` is a dependency, run with this Node binary. Not `npx skills`: nested under
 * `npx topic-skillset` on Windows, npx leaks `npm_config_package` and grows PATH past
 * cmd.exe's 8191-char limit, both ending in "'skills' is not recognized".
 */
const skillsCli = (): string => fileURLToPath(import.meta.resolve('skills/bin/cli.mjs'));

export const vercelSkills = (run: Exec = exec, cli: () => string = skillsCli): SkillInstaller => ({
  async install(topic, opts) {
    const { code } = await run(process.execPath, [cli(), ...skillsAddArgs(topic, opts)], {
      shell: false,
    });
    if (code !== 0) throw new Error(`skills add failed for topic "${topic.name}" (exit ${code})`);
  },
});
