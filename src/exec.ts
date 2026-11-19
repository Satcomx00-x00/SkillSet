import { spawn } from 'node:child_process';

export interface ExecResult {
  readonly code: number;
  readonly stdout: string;
}

/** Process runner seam: swap in tests, keep commands side-effect free. */
export type Exec = (
  cmd: string,
  args: readonly string[],
  opts?: { cwd?: string; capture?: boolean },
) => Promise<ExecResult>;

export const exec: Exec = (cmd, args, { cwd, capture = false } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
      shell: process.platform === 'win32',
    });
    let stdout = '';
    child.stdout?.on('data', (d: Buffer) => {
      stdout += d;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, stdout }));
  });

export const execOk = async (...a: Parameters<Exec>): Promise<string> => {
  const [cmd, args] = a;
  const r = await exec(...a);
  if (r.code !== 0) throw new Error(`${cmd} ${args.join(' ')} exited with ${r.code}`);
  return r.stdout.trim();
};
