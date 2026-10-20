# tls-alpn-negotiate-kit

Selects the mutually supported application protocol from a ClientHello ALPN list and a server preference order.

```js
import { negotiateAlpn } from 'tls-alpn-negotiate-kit';

const selected = negotiateAlpn(
  ['h2', 'http/1.1'],        // what the client offered, in its order
  ['http/1.1', 'h2'],        // what the server prefers, in its order
);
// → 'http/1.1'
```

`negotiateAlpn(clientProtocols, serverProtocols)` returns the first protocol in the server's preference order that also appears in the client's list, or `null` if the two share no protocol.

## Why

TLS ALPN negotiation, per RFC 7301 §3.2, is the server's call: the server picks the first entry from its own preference list that the client also advertised. The protocol is simple, but wiring that preference order into a TLS stack is often the part people get wrong — they let the client's ordering leak through, or they conflate "mutual support" with "highest version number." This library exists to do that one decision and nothing else.

The trade-off: identifiers are treated as opaque ASCII strings. We do not parse them, so "h2" and "h3" are just labels — we will not infer that h3 is "better" than h2. If you want version-aware selection, put the versions in your server preference list in the order you want them chosen.

## Edge cases

- Identifiers are compared case-sensitively. The IANA ALPN registry entries are lowercase and case is significant on the wire; we do not fold.
- Duplicate entries within a single list are deduplicated, keeping the first occurrence. A client that lists `http/1.1` twice cannot use the second copy to jump the server's preference queue.
- Each identifier must be a non-empty string of at most 255 UTF-8 bytes, matching the single-byte length prefix in the wire format. Longer identifiers raise `RangeError`; non-strings and empty strings raise `TypeError`.
- Only string identifiers are supported. Binary ALPN labels (legal but vanishingly rare) are out of scope; pass them as UTF-8 strings or handle them at the TLS layer.
