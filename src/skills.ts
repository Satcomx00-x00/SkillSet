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
  '-y',
  'skills@latest',
  'add',
  treeUrl(topic),
  ...o.agents.flatMap((a) => ['--agent', a]),
  ...o.skills.flatMap((s) => ['--skill', s]),
  ...(o.global ? ['--global'] : []),
  ...(o.yes ? ['--yes'] : []),
];

export const vercelSkills = (run: Exec = exec): SkillInstaller => ({
  async install(topic, opts) {
    const { code } = await run('npx', skillsAddArgs(topic, opts));
    if (code !== 0) throw new Error(`skills add failed for topic "${topic.name}" (exit ${code})`);
  },
});
