import { displayFileName, sniffDocument } from './document-file';

const bytes = (...values: number[]) => Buffer.from([...values, 0x00, 0x01]);

describe('sniffDocument', () => {
  it('recognises PDF, JPEG and PNG by their first bytes', () => {
    expect(sniffDocument(Buffer.from('%PDF-1.7\n'))).toEqual({ contentType: 'application/pdf', extension: 'pdf' });
    expect(sniffDocument(bytes(0xff, 0xd8, 0xff, 0xe0))).toEqual({ contentType: 'image/jpeg', extension: 'jpg' });
    expect(sniffDocument(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toEqual({
      contentType: 'image/png',
      extension: 'png',
    });
  });

  it('refuses anything else, whatever its name says', () => {
    expect(sniffDocument(Buffer.from('MZ\x90\x00 an exe'))).toBeNull();
    expect(sniffDocument(Buffer.from('<svg/>'))).toBeNull();
    expect(sniffDocument(Buffer.alloc(0))).toBeNull();
  });
});

describe('displayFileName', () => {
  it('keeps the base name only, without control characters', () => {
    expect(displayFileName('C:\\Users\\sara\\iqama.pdf', 'pdf')).toBe('iqama.pdf');
    expect(displayFileName('../../etc/passwd', 'pdf')).toBe('passwd');
    expect(displayFileName('bad\u0000name\n.png', 'png')).toBe('badname.png');
  });

  it('falls back when nothing is left, and caps the length', () => {
    expect(displayFileName(undefined, 'pdf')).toBe('document.pdf');
    expect(displayFileName('   ', 'jpg')).toBe('document.jpg');
    expect(displayFileName(`${'a'.repeat(200)}.pdf`, 'pdf')).toHaveLength(120);
  });
});
