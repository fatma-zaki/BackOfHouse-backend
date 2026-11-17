/**
 * Article bodies (docs/admin/docs/04-api-conventions.md "Sanitize rich text on write").
 * Editors send HTML; we keep a small allow-list and rebuild the markup from a parsed tree,
 * so nothing from the input reaches the output unescaped: text is always escaped, the only
 * attribute kept is an http(s) or mailto `href`, and everything else is dropped. The same
 * tree gives the app its body blocks (contracts/app `ArticleBlock`) and the plain text
 * used for checks and reading time.
 */

export type ArticleBlock =
  | { type: 'PARAGRAPH'; text: string }
  | { type: 'QUOTE'; text: string; attribution?: string }
  | { type: 'NOTICE'; text: string; title?: string };

interface Element {
  tag: string;
  href?: string;
  children: Node[];
}
type Node = Element | string;

/** Block elements kept as they are. */
const BLOCKS = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'aside']);
/** Inline elements kept as they are (`br` is void). */
const INLINES = new Set(['strong', 'em', 'u', 'a', 'cite', 'br']);
/** Other names mapped onto the allow-list. */
const ALIASES: Record<string, string> = {
  b: 'strong',
  i: 'em',
  h1: 'h2',
  h4: 'h3',
  h5: 'h3',
  h6: 'h3',
  div: 'p',
  section: 'p',
  article: 'p',
  figcaption: 'p',
};
/** Removed together with everything inside them. */
const DROP_WITH_CONTENT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
  'textarea',
  'title',
  'head',
  'svg',
  'math',
  'select',
  'button',
  'form',
]);
/** A block opened inside one of these closes it first, as browsers do for `<p>`. */
const TEXT_BLOCKS = new Set(['p', 'h2', 'h3']);

const MAX_HREF = 2000;

const TOKEN = /<!--[\s\S]*?(?:-->|$)|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|<|[^<]+/g;
const HREF = /(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text: string): string {
  return text.replace(/&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z]{2,6});/gi, (match, ref: string) => {
    if (ref[0] !== '#') return NAMED_ENTITIES[ref.toLowerCase()] ?? match;
    const code = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
    const valid = code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) && code !== 0xfffe;
    return valid && (code >= 0x20 || code === 0x09 || code === 0x0a) ? String.fromCodePoint(code) : '';
  });
}

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(text: string): string {
  return escapeText(text).replace(/"/g, '&quot;');
}

/** http(s) and mailto only; anything else (javascript:, data:, relative) is dropped. */
function safeHref(attributes: string): string | undefined {
  const match = HREF.exec(attributes);
  if (!match) return undefined;
  // Browsers ignore control characters and whitespace inside a scheme.
  const href = decodeEntities(match[1] ?? match[2] ?? match[3] ?? '')
    .replace(/[\u0000- \u007f]/g, '')
    .trim();
  return href.length <= MAX_HREF && /^(https?:\/\/|mailto:)/i.test(href) ? href : undefined;
}

function parse(html: string): Element {
  const root: Element = { tag: '#root', children: [] };
  const stack: Element[] = [root];
  const top = () => stack[stack.length - 1];
  const closeTo = (tag: string) => {
    const index = stack.map((e) => e.tag).lastIndexOf(tag);
    if (index > 0) stack.length = index;
  };

  TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(html))) {
    const [token, slash, rawName, attributes] = match;
    if (token.startsWith('<!--')) continue;
    if (!rawName) {
      top().children.push(decodeEntities(token));
      continue;
    }
    const name = rawName.toLowerCase();
    if (DROP_WITH_CONTENT.has(name)) {
      if (!slash && !/\/\s*$/.test(attributes)) {
        const end = new RegExp(`</${name}\\s*>`, 'i');
        const rest = html.slice(TOKEN.lastIndex);
        const found = end.exec(rest);
        TOKEN.lastIndex = found ? TOKEN.lastIndex + found.index + found[0].length : html.length;
      }
      continue;
    }
    const tag = ALIASES[name] ?? name;
    if (!BLOCKS.has(tag) && !INLINES.has(tag)) continue;
    if (slash) {
      closeTo(tag);
      continue;
    }
    if (tag === 'br') {
      top().children.push({ tag: 'br', children: [] });
      continue;
    }
    if (BLOCKS.has(tag) && TEXT_BLOCKS.has(top().tag)) stack.pop();
    if (tag === 'li' && top().tag === 'li') stack.pop();
    const element: Element = { tag, children: [] };
    if (tag === 'a') element.href = safeHref(attributes);
    top().children.push(element);
    stack.push(element);
  }
  return root;
}

const isBlock = (node: Node): node is Element => typeof node !== 'string' && BLOCKS.has(node.tag);

/** Inline markup only: blocks found inside inline content keep just their content. */
function serializeInline(nodes: Node[]): string {
  return nodes
    .map((node) => {
      if (typeof node === 'string') return escapeText(node);
      if (node.tag === 'br') return '<br>';
      const inner = serializeInline(node.children);
      if (BLOCKS.has(node.tag)) return inner;
      if (node.tag === 'a') {
        return node.href
          ? `<a href="${escapeAttribute(node.href)}" rel="noopener noreferrer nofollow">${inner}</a>`
          : inner;
      }
      return inner ? `<${node.tag}>${inner}</${node.tag}>` : '';
    })
    .join('');
}

const hasText = (markup: string) => markup.replace(/<[^>]*>/g, '').trim() !== '';

/** Flow content: runs of loose inline content become paragraphs; lists hold only items. */
function serializeFlow(nodes: Node[], parent: string): string {
  const out: string[] = [];
  let run: Node[] = [];
  const flush = () => {
    const inner = serializeInline(run).trim();
    if (hasText(inner)) out.push(parent === 'ul' || parent === 'ol' ? `<li>${inner}</li>` : `<p>${inner}</p>`);
    run = [];
  };
  for (const node of nodes) {
    if (!isBlock(node)) {
      run.push(node);
      continue;
    }
    flush();
    out.push(serializeBlock(node, parent));
  }
  flush();
  return out.join('');
}

function serializeBlock(node: Element, parent: string): string {
  const inList = parent === 'ul' || parent === 'ol';
  switch (node.tag) {
    case 'ul':
    case 'ol': {
      const items = serializeFlow(node.children, node.tag);
      return items ? `<${node.tag}>${items}</${node.tag}>` : '';
    }
    case 'blockquote':
    case 'aside': {
      // No quote or notice inside another one, and no lists inside items.
      if (parent === 'blockquote' || parent === 'aside' || inList) return serializeFlow(node.children, parent);
      const inner = serializeFlow(node.children, node.tag);
      return inner ? `<${node.tag}>${inner}</${node.tag}>` : '';
    }
    default: {
      // p, h2, h3, li: inline content only.
      const tag = inList ? 'li' : node.tag === 'li' ? 'p' : node.tag;
      const inner = serializeInline(node.children).trim();
      return hasText(inner) ? `<${tag}>${inner}</${tag}>` : '';
    }
  }
}

/** The allow-listed HTML stored for an article body. Idempotent. */
export function sanitizeArticleHtml(html: string): string {
  return serializeFlow(parse(html).children, '#root');
}

/** Visible text; `<br>` becomes a line break and other whitespace collapses. */
function textOf(nodes: Node[], skip?: (e: Element) => boolean): string {
  return nodes
    .map((node) => {
      if (typeof node === 'string') return node.replace(/\s+/g, ' ');
      if (skip?.(node)) return '';
      if (node.tag === 'br') return '\n';
      const inner = textOf(node.children, skip);
      return BLOCKS.has(node.tag) ? `\n${inner}\n` : inner;
    })
    .join('');
}

const clean = (text: string) =>
  text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

const elements = (nodes: Node[]) => nodes.filter((n): n is Element => typeof n !== 'string');

/** contracts/app `ArticleBlock`s, in reading order, from stored (sanitized) HTML. */
export function articleBlocks(html: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  for (const node of elements(parse(sanitizeArticleHtml(html)).children)) {
    if (node.tag === 'ul' || node.tag === 'ol') {
      const items = elements(node.children).map((li, i) => {
        const text = clean(textOf(li.children));
        return node.tag === 'ol' ? `${i + 1}. ${text}` : `• ${text}`;
      });
      if (items.length) blocks.push({ type: 'PARAGRAPH', text: items.join('\n') });
    } else if (node.tag === 'blockquote') {
      const text = clean(textOf(node.children, (e) => e.tag === 'cite'));
      const attribution = clean(
        elements(collect(node, 'cite'))
          .map((c) => textOf(c.children))
          .join(' '),
      ).replace(/^[\s—–-]+/, '');
      if (text) blocks.push({ type: 'QUOTE', text, ...(attribution ? { attribution } : {}) });
    } else if (node.tag === 'aside') {
      const [first] = elements(node.children);
      const titled = first && (first.tag === 'h2' || first.tag === 'h3');
      const title = titled ? clean(textOf(first.children)) : '';
      const text = clean(textOf(titled ? node.children.filter((n) => n !== first) : node.children));
      if (text || title) blocks.push({ type: 'NOTICE', text, ...(title ? { title } : {}) });
    } else {
      const text = clean(textOf(node.children));
      if (text) blocks.push({ type: 'PARAGRAPH', text });
    }
  }
  return blocks;
}

function collect(node: Element, tag: string): Element[] {
  return elements(node.children).flatMap((child) => (child.tag === tag ? [child] : collect(child, tag)));
}

/** All visible text of a body, one block per line. */
export function articlePlainText(html: string): string {
  return articleBlocks(html)
    .map((b) => [b.type === 'NOTICE' ? b.title : undefined, b.text, b.type === 'QUOTE' ? b.attribution : undefined])
    .flat()
    .filter(Boolean)
    .join('\n');
}

/** Reading time at 200 words a minute, at least one minute. */
export function readMinutes(plainText: string): number {
  const words = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** The first `max` characters of the text, cut at a word with an ellipsis. */
export function teaserOf(plainText: string, max = 160): string {
  const text = plainText.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
