import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { negotiateAlpn } from '../src/index.js';

describe('negotiateAlpn', () => {
  it('returns the first server-preferred protocol the client offers', () => {
    const result = negotiateAlpn(['http/1.1', 'h2'], ['h2', 'http/1.1']);
    assert.equal(result, 'h2');
  });

  it('honours server preference over client preference', () => {
    const result = negotiateAlpn(['h2', 'http/1.1'], ['http/1.1', 'h2']);
    assert.equal(result, 'http/1.1');
  });

  it('returns null when there is no overlap', () => {
    const result = negotiateAlpn(['h2'], ['http/1.1']);
    assert.equal(result, null);
  });

  it('returns null when both lists are empty', () => {
    assert.equal(negotiateAlpn([], []), null);
  });

  it('returns null when the client list is empty but the server has offers', () => {
    assert.equal(negotiateAlpn([], ['h2']), null);
  });

  it('returns null when the server list is empty but the client has offers', () => {
    assert.equal(negotiateAlpn(['h2'], []), null);
  });

  it('treats identifiers case-sensitively', () => {
    assert.equal(negotiateAlpn(['H2'], ['h2']), null);
  });

  it('ignores duplicate entries within a single list', () => {
    const result = negotiateAlpn(['http/1.1', 'http/1.1', 'h2'], ['h2', 'http/1.1']);
    assert.equal(result, 'h2');
  });

  it('picks the first server preference even if the client listed a later one first', () => {
    const result = negotiateAlpn(['h3', 'h2', 'http/1.1'], ['http/1.1', 'h2', 'h3']);
    assert.equal(result, 'http/1.1');
  });

  it('accepts arbitrary ASCII identifiers not in any registry', () => {
    assert.equal(negotiateAlpn(['spdy/3.1'], ['spdy/3.1']), 'spdy/3.1');
  });

  it('throws TypeError if the client list is not an array', () => {
    assert.throws(() => negotiateAlpn('h2', ['h2']), TypeError);
  });

  it('throws TypeError if a protocol entry is not a string', () => {
    assert.throws(() => negotiateAlpn([42], ['h2']), TypeError);
  });

  it('throws TypeError if a protocol entry is an empty string', () => {
    assert.throws(() => negotiateAlpn([''], ['h2']), TypeError);
  });
});
