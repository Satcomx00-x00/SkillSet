import { BUNDLE_DIR, bundledTopicDir } from './bundle.ts';
import { treeUrl } from './github.ts';
import { bundledRegistry, type Registry } from './registry.ts';
import type { Topic } from './schema.ts';
import { githubSource, localSource, type TopicSource } from './source.ts';

/** Where topics come from: the registry, each topic's files, and what `skills add` installs from. */
export interface Catalog {
  readonly offline: boolean;
  readonly registry: Registry;
  source(topic: Topic): TopicSource;
  /** A GitHub tree URL, or a local directory. */
  location(topic: Topic): string;
}

export const onlineCatalog = (registry: Registry): Catalog => ({
  offline: false,
  registry,
  source: githubSource,
  location: treeUrl,
});

/** Reads only the snapshot embedded in this build: no network access. */
export const offlineCatalog = (root: string = BUNDLE_DIR): Catalog => {
  const dir = (t: Topic) => bundledTopicDir(t.name, root);
  return {
    offline: true,
    registry: bundledRegistry(root),
    source: (t) => localSource(dir(t)),
    location: dir,
  };
};
