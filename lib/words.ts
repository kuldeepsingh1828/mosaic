// wCare Digital Wall Activity word pool. Each word maps to a fixed canvas
// color so votes translate directly into cell colors. Keep in sync with the
// `word` CHECK constraint on public.word_tallies
// (see supabase/migrations/20260926000000_add_word_tallies.sql).
export const WORDS = [
  'Empathy',
  'Reliability',
  'Inclusivity',
  'Resourcefulness',
  'Humour',
  'Authenticity',
  'Advocacy',
  'Transparency',
] as const

export type Word = (typeof WORDS)[number]

export const WORD_COLORS: Record<Word, string> = {
  Empathy: '#e87963',
  Reliability: '#647bb1',
  Inclusivity: '#56a7a2',
  Resourcefulness: '#f2b66d',
  Humour: '#e9d66b',
  Authenticity: '#8eae8a',
  Advocacy: '#d58da0',
  Transparency: '#76a9c9',
}

export function isWord(value: unknown): value is Word {
  return typeof value === 'string' && (WORDS as readonly string[]).includes(value)
}
