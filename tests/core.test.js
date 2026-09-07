// tests/core.test.js

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

import { setupDom, resetDom, flush } from './helpers/jsdom-setup.js';

before(() => {
  setupDom();
});

describe('utilities/storage', async () => {
  const { createLocalStorageAdapter, createMemoryAdapter } = await import(
    '../src/utilities/storage.js'
  );

  test('localStorage adapter round-trips objects', () => {
    const storage = createLocalStorageAdapter();

    storage.set('k1', { a: 1, list: [1, 2, 3] });
    assert.deepEqual(storage.get('k1'), { a: 1, list: [1, 2, 3] });
    assert.equal(storage.has('k1'), true);

    storage.remove('k1');
    assert.equal(storage.get('k1', 'fallback'), 'fallback');
    assert.equal(storage.has('k1'), false);
  });

  test('memory adapter is isolated from localStorage', () => {
    const memory = createMemoryAdapter();
    memory.set('only-memory', true);

    assert.equal(memory.get('only-memory'), true);
    assert.equal(globalThis.localStorage.getItem('only-memory'), null);
  });

  test('broken JSON falls back safely', () => {
    globalThis.localStorage.setItem('broken', '{not json');

    const storage = createLocalStorageAdapter();
    assert.equal(storage.get('broken', 'safe'), 'safe');
  });
});

describe('utilities/dom-utils', async () => {
  const { escapeHtml, createElement, htmlToElement, delegate, debounce } = await import(
    '../src/utilities/dom-utils.js'
  );

  test('escapeHtml neutralizes dangerous characters', () => {
    assert.equal(
      escapeHtml(`<img src=x onerror="alert('1')">`),
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;'
    );
    assert.equal(escapeHtml(null), '');
  });

  test('createElement builds nested element', () => {
    const element = createElement('div', {
      className: 'box',
      attrs: { 'data-id': '7' },
      children: [createElement('span', { text: 'سلام' })],
    });

    assert.equal(element.className, 'box');
    assert.equal(element.dataset.id, '7');
    assert.equal(element.querySelector('span').textContent, 'سلام');
  });

  test('htmlToElement parses template', () => {
    const element = htmlToElement('<section class="a"><b>x</b></section>');
    assert.equal(element.className, 'a');
    assert.equal(element.querySelector('b').textContent, 'x');
  });

  test('delegate only fires for matching descendants', () => {
    const host = document.createElement('div');
    host.innerHTML = '<button class="ok">a</button><span class="no">b</span>';
    document.body.appendChild(host);

    let hits = 0;
    const off = delegate(host, '.ok', 'click', () => {
      hits += 1;
    });

    host.querySelector('.no').dispatchEvent(new globalThis.window.MouseEvent('click', { bubbles: true }));
    host.querySelector('.ok').dispatchEvent(new globalThis.window.MouseEvent('click', { bubbles: true }));

    assert.equal(hits, 1);

    off();
    host.querySelector('.ok').dispatchEvent(new globalThis.window.MouseEvent('click', { bubbles: true }));
    assert.equal(hits, 1);

    host.remove();
  });

  test('debounce collapses rapid calls', async () => {
    let calls = 0;
    const debounced = debounce(() => {
      calls += 1;
    }, 10);

    debounced();
    debounced();
    debounced();

    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(calls, 1);
  });
});

describe('utilities/formatters', async () => {
  const {
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    daysBetween,
    toLatinDigits,
    toNumber,
    getInitials,
    truncateText,
    formatPersianDate,
  } = await import('../src/utilities/formatters.js');

  test('formatNumber uses Persian digits', () => {
    assert.equal(formatNumber(1234), '۱٬۲۳۴');
  });

  test('formatCurrency appends toman', () => {
    assert.match(formatCurrency(1500000), /۱٬۵۰۰٬۰۰۰ تومان/);
  });

  test('toLatinDigits converts Persian and Arabic digits', () => {
    assert.equal(toLatinDigits('۱۲۳'), '123');
    assert.equal(toNumber('۱۲۳'), 123);
  });

  test('formatPersianDate returns Jalali text', () => {
    const text = formatPersianDate('2026-09-07T10:00:00.000Z');
    assert.match(text, /۱۴۰۵/);
  });

  test('formatRelativeTime handles now / past', () => {
    assert.equal(formatRelativeTime(new Date()), 'همین حالا');
    assert.match(formatRelativeTime(new Date(Date.now() - 3 * 60 * 60 * 1000)), /ساعت/);
    assert.equal(formatRelativeTime(null), '—');
  });

  test('daysBetween computes whole days', () => {
    assert.equal(daysBetween('2026-09-01T00:00:00.000Z', '2026-09-07T00:00:00.000Z'), 6);
  });

  test('text helpers', () => {
    assert.equal(getInitials('علی رضایی'), 'عر');
    assert.equal(truncateText('abcdefgh', 4), 'abcd…');
  });
});

describe('core/store', async () => {
  const { createStore } = await import('../src/core/store/store.js');

  test('setState with updater notifies subscribers', () => {
    const store = createStore({ initialState: { count: 0 } });

    const seen = [];
    store.subscribe(({ currentState }) => seen.push(currentState.count));

    store.setState((current) => ({ ...current, count: current.count + 1 }));
    store.setState({ count: 10 });

    assert.deepEqual(seen, [1, 10]);
  });

  test('watch only fires when selected slice changes', () => {
    const store = createStore({ initialState: { a: 1, b: 1 } });

    let hits = 0;
    store.watch((state) => state.a, () => {
      hits += 1;
    });

    store.setState((current) => ({ ...current, b: 2 }));
    assert.equal(hits, 0);

    store.setState((current) => ({ ...current, a: 2 }));
    assert.equal(hits, 1);
  });

  test('setState rejects invalid state', () => {
    const store = createStore({ initialState: {} });
    assert.throws(() => store.setState(() => null), TypeError);
  });
});

describe('utilities/css-scope', async () => {
  const { injectScopedCss, hasScopedCss, clearAllScopedCss } = await import(
    '../src/utilities/css-scope.js'
  );

  test('injects once and ref-counts releases', () => {
    clearAllScopedCss();

    const releaseA = injectScopedCss('.a{color:red}', 'demo');
    const releaseB = injectScopedCss('.a{color:red}', 'demo');

    assert.equal(hasScopedCss('demo'), true);
    assert.equal(document.querySelectorAll('#vixora-style-demo').length, 1);

    releaseA();
    assert.equal(hasScopedCss('demo'), true, 'second holder still active');

    releaseB();
    assert.equal(hasScopedCss('demo'), false);
    assert.equal(document.getElementById('vixora-style-demo'), null);
  });
});
