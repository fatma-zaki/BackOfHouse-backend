import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';

type Spec = {
  paths: Record<string, Record<string, { responses?: Record<string, { $ref?: string; content?: unknown }> }>>;
  components: Record<string, Record<string, unknown>>;
};

const cache: Partial<Record<'app' | 'admin', { spec: Spec; ajv: Ajv2020 }>> = {};

function load_(surface: 'app' | 'admin') {
  if (!cache[surface]) {
    const spec = load(readFileSync(join(__dirname, '..', '..', 'contracts', surface, 'openapi.yaml'), 'utf8')) as Spec;
    // OpenAPI 3.1 schemas are JSON Schema 2020-12; `example` is an annotation.
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    ajv.addSchema({ $id: 'contract', components: spec.components });
    cache[surface] = { spec, ajv };
  }
  return cache[surface]!;
}

const rewriteRefs = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(rewriteRefs);
  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) =>
        key === '$ref' && typeof value === 'string' && value.startsWith('#/')
          ? [key, `contract${value}`]
          : [key, rewriteRefs(value)],
      ),
    );
  }
  return node;
};

/**
 * Checks a response body against the contract's schema for that operation and status
 * (contracts/<surface>/openapi.yaml). Returns the ajv errors, or [] when it conforms.
 * `path` is the contract path, e.g. `/companies/{id}`.
 */
export function contractErrors(
  surface: 'app' | 'admin',
  method: string,
  path: string,
  status: number,
  body: unknown,
): string[] {
  const { spec, ajv } = load_(surface);
  const operation = spec.paths[path]?.[method.toLowerCase()];
  if (!operation) return [`${method} ${path} is not in contracts/${surface}`];
  let response = operation.responses?.[String(status)];
  if (response?.$ref) response = spec.components.responses[response.$ref.split('/').pop()!] as typeof response;
  if (!response) return [`${method} ${path} has no ${status} response in the contract`];
  const schema = (response.content as Record<string, { schema?: unknown }> | undefined)?.['application/json']?.schema;
  if (!schema)
    return body === undefined || body === '' || (typeof body === 'object' && !Object.keys(body ?? {}).length)
      ? []
      : ['contract has no body'];
  const validate = ajv.compile(rewriteRefs(schema) as object);
  return validate(body) ? [] : (validate.errors ?? []).map((e) => `${e.instancePath || '(root)'} ${e.message}`);
}
