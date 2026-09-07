// tests/data.test.js

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

import { setupDom } from './helpers/jsdom-setup.js';

before(() => {
  setupDom();
});

describe('core/storage/db-client (localStorage only)', async () => {
  const db = await import('../src/core/storage/db-client.js');

  test('default db mode is local (no backend)', () => {
    assert.equal(db.getDbMode(), 'local');
    assert.equal(db.isRemoteEnabled(), false);
  });

  test('seeds users into localStorage on first read', async () => {
    await db.ensureDatabaseReady();

    const raw = JSON.parse(globalThis.localStorage.getItem('ViXoRa:users'));
    assert.ok(Array.isArray(raw.users), 'users array must exist in localStorage');
    assert.ok(raw.users.length >= 2, 'seed users must be present');

    const users = await db.getAllUsers();
    assert.ok(users.find((user) => user.username === 'alirh'));
  });

  test('normalizeUserRecord fills every missing field', () => {
    const normalized = db.normalizeUserRecord({ username: '  test ', name: 'T' });

    assert.equal(normalized.username, 'test');
    assert.equal(normalized.role, 'user');
    assert.equal(normalized.plan, 'plus');
    assert.deepEqual(normalized.tools, { notes: [], todos: [], customerInfo: [] });
    assert.ok(normalized.id, 'id must be generated');
    assert.ok(normalized.createdAt, 'createdAt must be generated');
    assert.equal(normalized.profileIsComplete, false);
  });

  test('sanitizeUser removes password', () => {
    const safe = db.sanitizeUser({ id: '1', username: 'a', password: 'secret' });
    assert.equal(safe.password, undefined);
    assert.equal(safe.username, 'a');
  });

  test('createUser rejects duplicate username and email', async () => {
    await assert.rejects(
      db.createUser({ username: 'alirh', email: 'x@y.com', password: '123456' }),
      /Username already exists/
    );

    await assert.rejects(
      db.createUser({ username: 'fresh-one', email: 'ali@gmail.com', password: '123456' }),
      /Email already exists/
    );
  });

  test('createUser → getUserById → updateUserInDatabase → deleteUser', async () => {
    const created = await db.createUser({
      username: 'temp-user',
      name: 'Temp',
      email: 'temp@vixora.dev',
      password: '123456',
    });

    assert.ok(created.id);
    assert.equal(created.tools.notes.length, 0);

    const fetched = await db.getUserById(created.id);
    assert.equal(fetched.username, 'temp-user');

    const updated = await db.updateUserInDatabase(created.id, (current) => ({
      ...current,
      name: 'Temp Updated',
    }));

    assert.equal(updated.name, 'Temp Updated');
    assert.ok(updated.lastUpdated, 'lastUpdated must be stamped');

    await db.deleteUser(created.id);
    assert.equal(await db.getUserById(created.id), null);
  });

  test('findUserByCredentials validates password', async () => {
    const ok = await db.findUserByCredentials('alirh', 'ali12345');
    assert.ok(ok, 'correct credentials must resolve');

    const bad = await db.findUserByCredentials('alirh', 'wrong');
    assert.equal(bad, null);

    const missing = await db.findUserByCredentials('nobody', 'x');
    assert.equal(missing, null);
  });

  test('searchUsers matches multiple fields', async () => {
    const results = await db.searchUsers('ali@gmail');
    assert.ok(results.length >= 1);
    assert.ok(results.every((user) => user.email.includes('ali@gmail')));
  });

  test('returned objects are clones (no state leakage)', async () => {
    const first = await db.getUserById('1');
    first.name = 'HACKED';

    const second = await db.getUserById('1');
    assert.notEqual(second.name, 'HACKED');
  });

  test('resetDatabase restores seed', async () => {
    await db.createUser({ username: 'to-be-wiped', email: 'wipe@vixora.dev', password: '123456' });
    await db.resetDatabase();

    const users = await db.getAllUsers();
    assert.equal(users.find((user) => user.username === 'to-be-wiped'), undefined);
    assert.ok(users.find((user) => user.username === 'alirh'));
  });
});

describe('core/services/auth-service', async () => {
  const auth = await import('../src/core/services/auth-service.js');
  const { getAppState, initializeAppState, clearAuthUser } = await import(
    '../src/core/state/app-state.js'
  );
  const { getStoredUser } = await import('../src/core/storage/session-storage.js');

  before(() => {
    initializeAppState();
  });

  test('register validates input', async () => {
    assert.equal((await auth.register({ username: 'ab' })).success, false);
    assert.equal(
      (await auth.register({ name: 'X', username: 'ok_user', email: 'bad-email', password: '123456' })).success,
      false
    );
    assert.equal(
      (
        await auth.register({
          name: 'X',
          username: 'ok_user',
          email: 'ok@vixora.dev',
          password: '123',
        })
      ).success,
      false
    );
  });

  test('register creates user with tools schema and logs in', async () => {
    const result = await auth.register({
      name: 'سارا',
      lastName: 'محمدی',
      username: 'sara_m',
      email: 'sara@vixora.dev',
      password: 'sara123456',
      confirmPassword: 'sara123456',
    });

    assert.equal(result.success, true, result.message);
    assert.deepEqual(Object.keys(result.user.tools).sort(), ['customerInfo', 'notes', 'todos']);
    assert.equal(result.user.password, undefined, 'password must never leave the service');

    assert.equal(getAppState().auth.status, 'authenticated');
    assert.equal(getStoredUser().username, 'sara_m');
  });

  test('register blocks duplicate username', async () => {
    const result = await auth.register({
      name: 'dup',
      username: 'sara_m',
      email: 'other@vixora.dev',
      password: 'sara123456',
    });

    assert.equal(result.success, false);
    assert.match(result.message, /قبلاً ثبت شده/);
  });

  test('logout clears session and state', async () => {
    await auth.logout();

    assert.equal(getAppState().auth.status, 'guest');
    assert.equal(getStoredUser(), null);
  });

  test('login with wrong password fails, with right password succeeds', async () => {
    const failed = await auth.login('sara_m', 'nope');
    assert.equal(failed.success, false);

    const ok = await auth.login('sara_m', 'sara123456');
    assert.equal(ok.success, true);
    assert.equal(getAppState().auth.user.username, 'sara_m');
  });

  test('restoreSession revalidates stored user', async () => {
    const result = await auth.restoreSession();
    assert.equal(result.authenticated, true);
    assert.equal(result.user.username, 'sara_m');
  });

  test('restoreSession returns guest when nothing stored', async () => {
    await auth.logout();
    const result = await auth.restoreSession();
    assert.equal(result.authenticated, false);
    assert.equal(result.reason, 'guest');
  });

  test('restoreSession invalidates session of deleted user', async () => {
    await auth.login('sara_m', 'sara123456');

    const db = await import('../src/core/storage/db-client.js');
    await db.deleteUser(getAppState().auth.user.id);

    const result = await auth.restoreSession();
    assert.equal(result.authenticated, false);
    assert.equal(result.reason, 'invalid-session');
  });

  test('updateProfile syncs state + session', async () => {
    await auth.register({
      name: 'نیما',
      username: 'nima_p',
      email: 'nima@vixora.dev',
      password: 'nima123456',
    });

    const result = await auth.updateProfile(getAppState().auth.user.id, {
      name: 'نیما پارسا',
      jobTitle: 'developer',
      password: 'should-be-ignored',
    });

    assert.equal(result.success, true);
    assert.equal(getAppState().auth.user.name, 'نیما پارسا');
    assert.equal(getAppState().auth.user.jobTitle, 'developer');
    assert.equal(getStoredUser().password, undefined);
  });

  test('changePassword checks the current password', async () => {
    const userId = getAppState().auth.user.id;

    const wrong = await auth.changePassword(userId, 'bad', 'newpass123');
    assert.equal(wrong.success, false);

    const ok = await auth.changePassword(userId, 'nima123456', 'newpass123');
    assert.equal(ok.success, true);

    const login = await auth.login('nima_p', 'newpass123');
    assert.equal(login.success, true);
  });

  test('getPasswordStrength scores length + complexity', () => {
    assert.equal(auth.getPasswordStrength(''), 0);
    assert.equal(auth.getPasswordStrength('abcdef'), 1);
    assert.equal(auth.getPasswordStrength('Abcdefghij1!'), 4);
  });

  test('clearAuthUser leaves guest state', () => {
    clearAuthUser();
    assert.equal(getAppState().auth.status, 'guest');
  });
});

describe('core/actions/tools-service', async () => {
  const tools = await import('../src/core/actions/tools-service.js');
  const auth = await import('../src/core/services/auth-service.js');
  const { getAppState, initializeAppState } = await import('../src/core/state/app-state.js');

  before(async () => {
    initializeAppState();
    await auth.register({
      name: 'کاربر ابزار',
      username: 'tool_user',
      email: 'tools@vixora.dev',
      password: 'tools123456',
    });
  });

  test('getToolData returns [] for an empty tool', async () => {
    const list = await tools.getToolData('notes');
    assert.deepEqual(list, []);
  });

  test('toolName validation', async () => {
    await assert.rejects(tools.getToolData(''), TypeError);
    await assert.rejects(tools.getToolData(null), TypeError);
    await assert.rejects(tools.getToolData(123), TypeError);
  });

  test('createToolItem persists to localStorage and state', async () => {
    const note = await tools.createToolItem('notes', { title: 'اولین', content: 'متن' });

    assert.ok(note.id.startsWith('notes-'), 'id must be namespaced by tool');
    assert.ok(note.createdAt);
    assert.equal(note.title, 'اولین');

    const fromDb = await tools.getToolData('notes');
    assert.equal(fromDb.length, 1);

    const fromState = getAppState().auth.user.tools.notes;
    assert.equal(fromState.length, 1, 'state must be synced after write');

    const raw = JSON.parse(globalThis.localStorage.getItem('ViXoRa:active-user'));
    assert.equal(raw.tools.notes.length, 1, 'session storage must be synced too');
    assert.equal(raw.password, undefined, 'session must not hold the password');
  });

  test('newest item is first', async () => {
    await tools.createToolItem('notes', { title: 'دومین' });
    const list = await tools.getToolData('notes');

    assert.equal(list[0].title, 'دومین');
    assert.equal(list[1].title, 'اولین');
  });

  test('updateToolItem merges fields, protects id/createdAt, stamps updatedAt', async () => {
    const list = await tools.getToolData('notes');
    const target = list[0];

    const updated = await tools.updateToolItem('notes', target.id, {
      title: 'ویرایش‌شده',
      id: 'HACK',
      createdAt: 'HACK',
    });

    assert.equal(updated.title, 'ویرایش‌شده');
    assert.equal(updated.id, target.id, 'id must not be overwritable');
    assert.equal(updated.createdAt, target.createdAt, 'createdAt must not be overwritable');
    assert.ok(updated.updatedAt);
  });

  test('updateToolItem on unknown id rejects', async () => {
    await assert.rejects(tools.updateToolItem('notes', 'nope', { title: 'x' }), /not found/);
  });

  test('getToolItem finds a single record', async () => {
    const list = await tools.getToolData('notes');
    const found = await tools.getToolItem('notes', list[0].id);

    assert.equal(found.id, list[0].id);
    assert.equal(await tools.getToolItem('notes', 'missing'), null);
  });

  test('deleteToolItem removes and rejects unknown ids', async () => {
    const list = await tools.getToolData('notes');
    const before = list.length;

    await tools.deleteToolItem('notes', list[0].id);

    const after = await tools.getToolData('notes');
    assert.equal(after.length, before - 1);

    await assert.rejects(tools.deleteToolItem('notes', list[0].id), /not found/);
  });

  test('setToolItems replaces the whole list', async () => {
    await tools.setToolItems('todos', [
      { id: 'todos-1', title: 'الف' },
      { id: 'todos-2', title: 'ب' },
    ]);

    assert.equal(await tools.countToolItems('todos'), 2);
  });

  test('deleteManyToolItems returns removed count', async () => {
    const removed = await tools.deleteManyToolItems('todos', ['todos-1', 'ghost']);
    assert.equal(removed, 1);
    assert.equal(await tools.countToolItems('todos'), 1);
  });

  test('reorderToolItems applies the given order', async () => {
    await tools.setToolItems('todos', [
      { id: 't1' },
      { id: 't2' },
      { id: 't3' },
    ]);

    await tools.reorderToolItems('todos', ['t3', 't1', 't2']);

    const list = await tools.getToolData('todos');
    assert.deepEqual(
      list.map((item) => item.id),
      ['t3', 't1', 't2']
    );
  });

  test('importToolItems generates fresh ids', async () => {
    const count = await tools.importToolItems('todos', [{ title: 'وارداتی' }, null, 'bad']);
    assert.equal(count, 1);

    const list = await tools.getToolData('todos');
    assert.ok(list[0].id.startsWith('todos-'));
    assert.ok(list[0].importedAt);
  });

  test('exportToolItems returns a portable payload', async () => {
    const payload = await tools.exportToolItems('todos');

    assert.equal(payload.tool, 'todos');
    assert.equal(payload.items.length, payload.count);
    assert.ok(payload.exportedAt);
  });

  test('tools of different names never collide', async () => {
    await tools.createToolItem('customerInfo', { name: 'مشتری ۱' });

    const notes = await tools.getToolData('notes');
    const customers = await tools.getToolData('customerInfo');

    assert.equal(customers.length, 1);
    assert.ok(notes.every((note) => note.title !== undefined));
  });

  test('tools-service refuses to run without an authenticated user', async () => {
    const { clearAuthUser } = await import('../src/core/state/app-state.js');
    clearAuthUser();

    await assert.rejects(tools.getToolData('notes'), /No authenticated user/);
  });
});
