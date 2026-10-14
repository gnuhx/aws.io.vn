import { describe, expect, it } from 'vitest'
import { profileUpdateSchema } from './profile.ts'

const base = { name: 'Ada', hobbies: [], techStack: [], bio: '' }

describe('profileUpdateSchema', () => {
  it('trims, drops blanks and removes case-insensitive duplicates', () => {
    expect(profileUpdateSchema.parse({ ...base, name: '  ', techStack: [' AWS', 'aws', '', 'React '] }))
      .toEqual({ name: null, hobbies: [], techStack: ['AWS', 'React'], bio: '' })
  })

  it.each([
    ['long name', { ...base, name: 'x'.repeat(61) }],
    ['long bio', { ...base, bio: 'x'.repeat(501) }],
    ['long tag', { ...base, hobbies: ['x'.repeat(31)] }],
    ['too many hobbies', { ...base, hobbies: Array.from({ length: 11 }, (_, i) => `h${i}`) }],
    ['unknown field', { ...base, email: 'b@x.io' }],
  ])('rejects %s', (_label, input) => {
    expect(profileUpdateSchema.safeParse(input).success).toBe(false)
  })

  it('counts the limit after removing duplicates', () => {
    const hobbies = [...Array.from({ length: 10 }, (_, i) => `h${i}`), 'H0']
    expect(profileUpdateSchema.parse({ ...base, hobbies }).hobbies).toHaveLength(10)
  })
})
