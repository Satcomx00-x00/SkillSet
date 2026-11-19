import { z } from 'zod';

const kebab = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case')
  .max(64);
const repoSlug = z.string().regex(/^[\w.-]+\/[\w.-]+$/, 'must be owner/repo');
const stringMap = z.record(z.string(), z.string());

/** `.claude-plugin/marketplace.json` on main: the single source of truth for topics. */
export const MarketplaceSchema = z.object({
  $schema: z.string().optional(),
  name: kebab,
  description: z.string().optional(),
  owner: z.object({ name: z.string().min(1), url: z.url().optional() }),
  plugins: z.array(
    z.looseObject({
      name: kebab,
      description: z.string().min(1),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      source: z.object({ source: z.literal('github'), repo: repoSlug, ref: z.string().min(1) }),
    }),
  ),
});

/** `.claude-plugin/plugin.json` on a topic branch. */
export const PluginManifestSchema = z.looseObject({
  name: kebab,
  description: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+/, 'must be semver'),
});

const StdioServer = z.looseObject({
  type: z.literal('stdio').optional(),
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: stringMap.optional(),
});
const RemoteServer = z.looseObject({
  type: z.enum(['http', 'sse']),
  url: z.string().min(1),
  headers: stringMap.optional(),
});
export const McpServerSchema = z.union([StdioServer, RemoteServer]);
export const McpConfigSchema = z.object({ mcpServers: z.record(kebab, McpServerSchema) });

/** Agent Skills spec frontmatter (agentskills.io). */
export const SkillFrontmatterSchema = z.looseObject({
  name: kebab,
  description: z.string().min(1).max(1024),
});

const ImportedSkill = z.union([kebab, z.object({ name: kebab, as: kebab })]);

/** `skillset.json` on a topic branch: external skills to vendor. */
export const TopicConfigSchema = z.object({
  $schema: z.string().optional(),
  imports: z
    .array(
      z.object({
        repo: repoSlug,
        ref: z.string().min(1).default('HEAD'),
        path: z.string().default('skills'),
        skills: z.array(ImportedSkill).min(1),
        /** Also vendor the repo's `setup-*` skills found next to the imported ones. */
        setup: z.boolean().default(true),
      }),
    )
    .default([]),
});

/** `skills.lock.json`: what `skillset sync` vendored, pinned by commit + content hash. */
export const LockSchema = z.object({
  version: z.literal(1),
  skills: z.record(
    kebab,
    z.object({
      repo: repoSlug,
      ref: z.string(),
      commit: z.string().regex(/^[0-9a-f]{40}$/),
      path: z.string(),
      license: z.string().nullable(),
      integrity: z.string().startsWith('sha256-'),
    }),
  ),
});

export type Marketplace = z.infer<typeof MarketplaceSchema>;
export type McpServer = z.infer<typeof McpServerSchema>;
export type McpConfig = z.infer<typeof McpConfigSchema>;
export type TopicConfig = z.infer<typeof TopicConfigSchema>;
export type SkillImport = TopicConfig['imports'][number];
export type Lock = z.infer<typeof LockSchema>;
export type LockEntry = Lock['skills'][string];

export interface Topic {
  readonly name: string;
  readonly description: string;
  readonly repo: string;
  readonly ref: string;
  readonly tags: readonly string[];
}

export const toTopics = (m: Marketplace): Topic[] =>
  m.plugins.map(({ name, description, tags = [], source: { repo, ref } }) => ({
    name,
    description,
    repo,
    ref,
    tags,
  }));
