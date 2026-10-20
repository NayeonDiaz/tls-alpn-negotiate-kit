/**
 * @module tls-alpn-negotiate-kit/core
 */

/**
 * Normalise a protocol identifier.
 *
 * ALPN identifiers are defined by RFC 7301 as opaque byte sequences, but in
 * practice they are ASCII strings (e.g. "h2", "http/1.1"). We compare them
 * byte-wise rather than case-insensitively because the registry entries are
 * case-sensitive and TLS does not perform any case folding.
 *
 * We accept strings only. Binary protocols are intentionally unsupported —
 * see README "Why".
 *
 * @param {string} p
 * @returns {string}
 * @throws {TypeError} if p is not a string or is empty.
 * @throws {RangeError} if p exceeds the 255-byte ALPN length limit.
 */
function normaliseProtocol(p) {
  if (typeof p !== 'string') {
    throw new TypeError('ALPN protocol identifiers must be strings');
  }
  if (p.length === 0) {
    throw new TypeError('ALPN protocol identifiers must be non-empty');
  }
  // Each ALPN entry is length-prefixed by a single byte in the wire format,
  // so any single identifier over 255 bytes is unencodable.
  if (Buffer.byteLength(p, 'utf8') > 255) {
    throw new RangeError('ALPN protocol identifiers must not exceed 255 bytes');
  }
  return p;
}

/**
 * Normalise a list of protocol identifiers.
 *
 * Duplicate entries within a single list are allowed on the wire, but for
 * comparison purposes we preserve order and keep the first occurrence of
 * each identifier so a client listing "http/1.1" twice does not shadow a
 * later server preference by accident.
 *
 * @param {string[]} list
 * @returns {string[]}
 */
function normaliseList(list) {
  if (!Array.isArray(list)) {
    throw new TypeError('Protocol lists must be arrays of strings');
  }
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const proto = normaliseProtocol(item);
    if (!seen.has(proto)) {
      seen.add(proto);
      out.push(proto);
    }
  }
  return out;
}

/**
 * Negotiate a single application protocol from a client-offered list and a
 * server-preferred order.
 *
 * Per RFC 7301 §3.2, the server SHOULD pick the first protocol in its own
 * preference order that also appears in the client's list. This function
 * implements exactly that behaviour and returns the selected protocol, or
 * null when no overlap exists (the caller then signals failure to the peer).
 *
 * @param {string[]} clientProtocols - Protocols advertised by the client,
 *   in client preference order.
 * @param {string[]} serverProtocols - Protocols the server is willing to
 *   offer, in server preference order.
 * @returns {string|null} The negotiated protocol, or null if none overlap.
 * @throws {TypeError} if either argument is not an array, or contains a
 *   non-string or empty string.
 * @throws {RangeError} if any single protocol identifier exceeds 255 bytes.
 */
export function negotiateAlpn(clientProtocols, serverProtocols) {
  const client = normaliseList(clientProtocols);
  const server = normaliseList(serverProtocols);

  // Build a set of client-offered protocols for O(1) membership tests as we
  // walk the server list. We do not care about client order here because the
  // spec gives the server the tie-breaking preference.
  const clientSet = new Set(client);

  for (const candidate of server) {
    if (clientSet.has(candidate)) {
      return candidate;
    }
  }
  return null;
}
