/**
 * The landing page's one piece of product proof — a real devlog, shown as the concrete answer to
 * "what does a build record look like?" A devlog-query failure must render as a real error, never
 * as "no developer has posted anything yet." An honestly empty result (no public devlog exists yet)
 * is its own distinct state. And once a devlog exists, a *project*-lookup failure is distinct again
 * from a project that genuinely has no cover — the former must never be silently reported as the
 * latter, since that would be a false claim ("this project has no cover") standing in for a true one
 * ("we couldn't check"). The landing page must remain fully functional in every one of these cases.
 */

export type LandingProofState =
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'ready'; projectStatus: 'cover' | 'no-cover' | 'unknown' }

export function classifyLandingProof(devlogsError: boolean, devlog: unknown, projectError: boolean, hasCover: boolean): LandingProofState {
  if (devlogsError) return { kind: 'error' }
  if (!devlog) return { kind: 'empty' }
  if (projectError) return { kind: 'ready', projectStatus: 'unknown' }
  return { kind: 'ready', projectStatus: hasCover ? 'cover' : 'no-cover' }
}
