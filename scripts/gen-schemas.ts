import { writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { LockSchema, McpConfigSchema, TopicConfigSchema } from '../src/schema.ts';

const out = {
  'skillset.schema.json': TopicConfigSchema,
  'skills.lock.schema.json': LockSchema,
  'mcp.schema.json': McpConfigSchema,
};
await Promise.all(
  Object.entries(out).map(([f, s]) =>
    writeFile(`schemas/${f}`, `${JSON.stringify(z.toJSONSchema(s, { io: 'input' }), null, 2)}\n`),
  ),
);
