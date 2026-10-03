import type { ZodType } from 'zod';

// Future local adapters provide domain JSON, learning Markdown, simulation JSON,
// and 3D metadata JSON separately. This boundary loads no production dataset.
export type ContentKind = 'domain' | 'learning' | 'simulation' | '3d';

export interface ContentSource {
  read(kind: ContentKind, relativePath: string): Promise<unknown>;
}

export type ContentValidation<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly issues: readonly {
        readonly path: string;
        readonly message: string;
      }[];
    };

// JSON decoding / Markdown reading belongs to an adapter, not domain contracts.
export function validateContent<T>(
  schema: ZodType<T>,
  input: unknown,
): ContentValidation<T> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  };
}
