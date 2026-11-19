import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { z } from 'zod';

export const exists = (p: string): Promise<boolean> =>
  stat(p).then(
    () => true,
    () => false,
  );

export const parseWith = <S extends z.ZodType>(
  schema: S,
  data: unknown,
  label: string,
): z.output<S> => {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const issues = r.error.issues.map((i) => `  ${i.path.join('.') || '<root>'}: ${i.message}`);
  throw new Error(`Invalid ${label}:\n${issues.join('\n')}`);
};

export const readJson = async <S extends z.ZodType>(
  path: string,
  schema: S,
): Promise<z.output<S>> => parseWith(schema, JSON.parse(await readFile(path, 'utf8')), path);

/** Reads a JSON object, returning `{}` when the file is missing. */
export const readJsonObject = async (path: string): Promise<Record<string, unknown>> =>
  (await exists(path)) ? (JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>) : {};

export const writeJson = async (path: string, data: unknown): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
};
