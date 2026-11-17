import { articleBlocks, articlePlainText, readMinutes, sanitizeArticleHtml, teaserOf } from './article-html';

describe('sanitizeArticleHtml', () => {
  it.each([
    ['<p>Hi<script>alert(1)</script></p>', '<p>Hi</p>'],
    ['<p onclick="x()">Hi</p>', '<p>Hi</p>'],
    ['<img src=x onerror=alert(1)>Text', '<p>Text</p>'],
    ['<a href="javascript:alert(1)">x</a>', '<p>x</p>'],
    ['<a href=" jav&#x09;ascript:alert(1)">x</a>', '<p>x</p>'],
    ['<a href="data:text/html,<b>">x</a>', '<p>x</p>'],
    ['<a href="/relative">x</a>', '<p>x</p>'],
    ['<style>p{}</style><p>a</p>', '<p>a</p>'],
    ['<iframe src="https://evil"></iframe><p>a</p>', '<p>a</p>'],
    ['<svg><script>alert(1)</script></svg><p>a</p>', '<p>a</p>'],
    ['<p>1 < 2 &amp; 3 > 2</p>', '<p>1 &lt; 2 &amp; 3 &gt; 2</p>'],
    ['<p>&lt;script&gt;</p>', '<p>&lt;script&gt;</p>'],
    ['<!-- secret --><p>a</p>', '<p>a</p>'],
    ['<p>a<script>never closed', '<p>a</p>'],
  ])('%s → %s', (input, output) => {
    expect(sanitizeArticleHtml(input)).toBe(output);
  });

  it('keeps the allow-listed markup and safe links', () => {
    expect(
      sanitizeArticleHtml(
        '<h2>Title</h2><p><b>Bold</b> and <i>it</i> <a href="https://gea.gov.sa/x?a=1&amp;b=2" target="_blank">link</a></p>' +
          '<ul><li>one</li><li>two</li></ul><blockquote><p>Said</p><cite>Someone</cite></blockquote>',
      ),
    ).toBe(
      '<h2>Title</h2><p><strong>Bold</strong> and <em>it</em> ' +
        '<a href="https://gea.gov.sa/x?a=1&amp;b=2" rel="noopener noreferrer nofollow">link</a></p>' +
        '<ul><li>one</li><li>two</li></ul><blockquote><p>Said</p><p><cite>Someone</cite></p></blockquote>',
    );
  });

  it('wraps loose text in paragraphs and drops empty blocks', () => {
    expect(sanitizeArticleHtml('Plain text<p> </p><div>From a div</div>')).toBe('<p>Plain text</p><p>From a div</p>');
  });

  it('is idempotent', () => {
    const inputs = [
      '<p>a <a href="https://x.sa">b</a></p><ul><li>c</li></ul>',
      '<blockquote>q<cite>— who</cite></blockquote><aside><h3>Note</h3>body</aside>',
      'x < y & "quoted"',
    ];
    for (const html of inputs) {
      const once = sanitizeArticleHtml(html);
      expect(sanitizeArticleHtml(once)).toBe(once);
    }
  });
});

describe('articleBlocks', () => {
  it('maps paragraphs, lists, quotes and notices to app blocks', () => {
    expect(
      articleBlocks(
        '<h2>Heading</h2><p>First<br>line</p><ol><li>a</li><li>b</li></ol>' +
          '<blockquote><p>Safety first.</p><cite>— GEA</cite></blockquote>' +
          '<aside><h3>Deadline</h3><p>Apply by Sunday.</p></aside>',
      ),
    ).toEqual([
      { type: 'PARAGRAPH', text: 'Heading' },
      { type: 'PARAGRAPH', text: 'First\nline' },
      { type: 'PARAGRAPH', text: '1. a\n2. b' },
      { type: 'QUOTE', text: 'Safety first.', attribution: 'GEA' },
      { type: 'NOTICE', title: 'Deadline', text: 'Apply by Sunday.' },
    ]);
  });

  it('reads Arabic text unchanged', () => {
    expect(articleBlocks('<p>هيئة الترفيه تعلن</p>')).toEqual([{ type: 'PARAGRAPH', text: 'هيئة الترفيه تعلن' }]);
  });
});

describe('plain text helpers', () => {
  it('counts reading time at 200 words a minute, at least one', () => {
    expect(readMinutes('')).toBe(1);
    expect(readMinutes(Array(401).fill('w').join(' '))).toBe(3);
  });

  it('cuts teasers at a word', () => {
    expect(teaserOf('short')).toBe('short');
    expect(teaserOf('one two three four', 12)).toBe('one two…');
  });

  it('joins block text for checks', () => {
    expect(articlePlainText('<p>a</p><blockquote>b<cite>c</cite></blockquote>')).toBe('a\nb\nc');
  });
});
