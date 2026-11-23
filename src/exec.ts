import { spawn } from 'node:child_process';

export interface ExecResult {
  readonly code: number;
  readonly stdout: string;
}

export interface ExecOptions {
  readonly cwd?: string;
  readonly capture?: boolean;
  /** Run through a shell. Defaults to true on Windows so `.cmd` shims (git, npx) resolve. */
  readonly shell?: boolean;
  /** Extra environment variables, merged over `process.env`. */
  readonly env?: Readonly<Record<string, string>>;
}

/** Process runner seam: swap in tests, keep commands side-effect free. */
export type Exec = (
  cmd: string,
  args: readonly string[],
  opts?: ExecOptions,
) => Promise<ExecResult>;

export const exec: Exec = (
  cmd,
  args,
  { cwd, capture = false, shell = process.platform === 'win32', env } = {},
) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
      shell,
      ...(env && { env: { ...process.env, ...env } }),
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
