import { describe, expect, it } from 'vitest'
import { finalizeEvent, generateSecretKey, nip19 } from 'nostr-tools'
import { readEmbedChannel, requireChannelAuthor } from './channel'

const event = finalizeEvent({ kind: 21, content: '', created_at: 1, tags: [] }, generateSecretKey())

describe('self-hosted channel embed', () => {
  it('leaves the general-purpose embed unrestricted when unconfigured', () => {
    expect(readEmbedChannel({})).toEqual({ pubkeys: null, relays: null })
    expect(() => requireChannelAuthor(event, readEmbedChannel({}))).not.toThrow()
  })

  it('accepts npubs and hex, normalizes and deduplicates them', () => {
    const channel = readEmbedChannel({
      VITE_EMBED_ALLOWED_PUBKEYS: `${nip19.npubEncode(event.pubkey)}, ${event.pubkey.toUpperCase()}`,
      VITE_EMBED_RELAYS: 'wss://relay.example, wss://relay.example/',
    })
    expect(channel).toEqual({ pubkeys: [event.pubkey], relays: ['wss://relay.example/'] })
    expect(() => requireChannelAuthor(event, channel)).not.toThrow()
    expect(() => requireChannelAuthor({ ...event, pubkey: 'a'.repeat(64) }, channel)).toThrow(
      'not from this channel'
    )
  })

  it.each(['', ' , ', 'npub1invalid', nip19.noteEncode('a'.repeat(64))])(
    'fails closed for an invalid or empty channel setting: %s',
    value => expect(() => readEmbedChannel({ VITE_EMBED_ALLOWED_PUBKEYS: value })).toThrow()
  )

  it.each(['', 'https://relay.example', 'not a URL'])(
    'rejects invalid configured relay lists: %s',
    value => expect(() => readEmbedChannel({ VITE_EMBED_RELAYS: value })).toThrow()
  )
})
