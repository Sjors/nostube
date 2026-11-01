import { nip19, type NostrEvent } from 'nostr-tools'

export interface EmbedChannel {
  /** null preserves the general-purpose embed; an empty configured list is an error. */
  pubkeys: string[] | null
  relays: string[] | null
}

/** Deployment settings, baked into the build and never taken from the video URL. */
export function readEmbedChannel(
  env: { VITE_EMBED_ALLOWED_PUBKEYS?: string; VITE_EMBED_RELAYS?: string } = import.meta.env
): EmbedChannel {
  const split = (value: string) =>
    value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  let pubkeys: string[] | null = null
  if (env.VITE_EMBED_ALLOWED_PUBKEYS !== undefined) {
    pubkeys = split(env.VITE_EMBED_ALLOWED_PUBKEYS).map(value => {
      if (/^[0-9a-f]{64}$/i.test(value)) return value.toLowerCase()
      const decoded = nip19.decode(value)
      if (decoded.type !== 'npub') throw new Error('Expected a channel npub or hex public key')
      return decoded.data
    })
    if (pubkeys.length === 0) throw new Error('The embed channel list is empty')
    pubkeys = [...new Set(pubkeys)]
  }
  let relays: string[] | null = null
  if (env.VITE_EMBED_RELAYS !== undefined) {
    relays = split(env.VITE_EMBED_RELAYS).map(value => {
      const url = new URL(value)
      if (!['wss:', 'ws:'].includes(url.protocol)) throw new Error('Expected a WebSocket relay URL')
      return url.href
    })
    if (relays.length === 0) throw new Error('The embed relay list is empty')
    relays = [...new Set(relays)]
  }
  return { pubkeys, relays }
}

/** Check before parsing media, discovering Blossom servers or fetching a profile. */
export function requireChannelAuthor(event: NostrEvent, channel: EmbedChannel): void {
  if (channel.pubkeys && !channel.pubkeys.includes(event.pubkey)) {
    throw new Error('This video is not from this channel')
  }
}
