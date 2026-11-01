import { describe, expect, it } from 'vitest'
import { parseBackUrl } from './url-params'

describe('embed return link', () => {
  const origin = 'https://podcast.example'

  it('returns to an episode on the same origin, preserving query and anchor', () => {
    expect(parseBackUrl('/@show/episodes/episode/discussion?x=1#comments', origin)).toBe(
      origin + '/@show/episodes/episode/discussion?x=1#comments'
    )
    expect(parseBackUrl(origin + '/@show/episodes/episode/discussion', origin)).toBe(
      origin + '/@show/episodes/episode/discussion'
    )
  })

  it('keeps a same-origin double-slash path from becoming a cross-origin link', () => {
    expect(parseBackUrl(origin + '//other.example/path', origin)).toBe(
      origin + '//other.example/path'
    )
  })

  it.each([
    null,
    '',
    'https://other.example/',
    '//other.example/',
    'javascript:alert(1)',
    'data:text/html,hello',
    'blob:https://podcast.example/id',
    '/\\other.example/',
  ])('omits missing or cross-origin return links: %s', value =>
    expect(parseBackUrl(value, origin)).toBeNull()
  )
})
