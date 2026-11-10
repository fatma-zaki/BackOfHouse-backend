/** contracts/app: PDF, JPEG or PNG, at most 10 MB. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export interface DocumentKind {
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png';
  extension: 'pdf' | 'jpg' | 'png';
}

const SIGNATURES: readonly { magic: number[]; kind: DocumentKind }[] = [
  { magic: [0x25, 0x50, 0x44, 0x46, 0x2d], kind: { contentType: 'application/pdf', extension: 'pdf' } },
  { magic: [0xff, 0xd8, 0xff], kind: { contentType: 'image/jpeg', extension: 'jpg' } },
  { magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], kind: { contentType: 'image/png', extension: 'png' } },
];

/**
 * The file's real type from its first bytes. The name and the declared content type are
 * the client's and are never trusted.
 */
export function sniffDocument(bytes: Buffer): DocumentKind | null {
  return SIGNATURES.find(({ magic }) => magic.every((byte, i) => bytes[i] === byte))?.kind ?? null;
}

/**
 * The member's file name, made safe to show: no path, no control characters, at most 120
 * characters. It is never used as a storage path.
 */
export function displayFileName(name: string | undefined, fallbackExtension: string): string {
  const base = (name ?? '').split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  const clean = base
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(-120);
  return clean || `document.${fallbackExtension}`;
}
