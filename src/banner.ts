import type { Line, TopicSummary } from './topic-info.ts';

const LOGO = [
  ' ___ _   _ _ _ ___      _   ',
  '/ __| |_(_) | / __| ___| |_ ',
  '\\__ \\ / / | | \\__ \\/ -_)  _|',
  '|___/_\\_\\_|_|_|___/\\___|\\__|',
];

const MAX_LINES = 2;

const ellipsis = (s: string, max: number): string =>
  s.length <= max ? s : `${s.slice(0, Math.max(0, max - 3)).trimEnd()}...`;

/** Greedy word wrap; never returns an empty array. */
export const wrap = (text: string, width: number): string[] =>
  text.split(/\s+/).reduce<string[]>(
    (lines, word) => {
      const last = lines.at(-1) ?? '';
      return !last
        ? [...lines.slice(0, -1), word]
        : `${last} ${word}`.length <= width
          ? [...lines.slice(0, -1), `${last} ${word}`]
          : [...lines, word];
    },
    [''],
  );

/** Renders a pure-ASCII summary box (no colour codes, safe for any terminal or log). */
export const renderBanner = (t: TopicSummary, width = 78): string => {
  const inner = width - 4;
  const row = (s = '') => `| ${ellipsis(s, inner).padEnd(inner)} |`;
  const rule = (c = '-') => `+${c.repeat(width - 2)}+`;
  const labelW = 24;
  const textW = inner - labelW - 2;
  const item = ({ label, text }: Line): string[] => {
    const all = wrap(text.replace(/\s+/g, ' ').trim(), textW);
    const body =
      all.length > MAX_LINES
        ? [...all.slice(0, MAX_LINES - 1), ellipsis(`${all[MAX_LINES - 1]} ...`, textW)]
        : all;
    const pad = ''.padEnd(labelW);
    const head =
      label.length < labelW
        ? [`${label.padEnd(labelW)}${body[0] ?? ''}`]
        : [label, `${pad}${body[0] ?? ''}`];
    return [...head, ...body.slice(1).map((l) => `${pad}${l}`)].map((l) => row(`  ${l}`));
  };
  const section = (title: string, lines: readonly Line[]) =>
    lines.length ? [row(), row(title), ...lines.flatMap(item)] : [];

  return [
    rule('='),
    ...LOGO.map((l) => row(l)),
    row(),
    row(`Topic: ${t.name}`),
    ...wrap(t.description, inner).map((l) => row(l)),
    rule(),
    ...section(`Skills (${t.skills.length})`, t.skills),
    ...section(`MCP servers (${t.mcp.length})`, t.mcp),
    ...section('Commands to type in your agent', t.commands),
    ...section('Run once in your terminal', t.cli),
    ...(t.notes.length
      ? [
          row(),
          row('Notes'),
          ...t.notes.flatMap((n) =>
            wrap(n, inner - 4).map((l, i) => row(`${i ? '    ' : '  - '}${l}`)),
          ),
        ]
      : []),
    row(),
    rule('='),
  ].join('\n');
};
