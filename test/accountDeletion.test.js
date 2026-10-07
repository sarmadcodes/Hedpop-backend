// Offline tests for account deletion: models and the socket service are
// replaced with in-memory fakes, so no database or network is touched.
// Run with:  npm test
const test = require('node:test');
const assert = require('node:assert/strict');

const SRC = '../src';

function stubModule(relPath, exports) {
  const resolved = require.resolve(`${SRC}/${relPath}`);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

// Shared call log so we can assert the ORDER of destructive operations.
let calls;
let userRecord;
let confirmedBookings;

function installFakes({ failOn } = {}) {
  calls = [];
  const maybeFail = (name) => {
    if (failOn === name) throw new Error(`${name} failed`);
  };

  stubModule('models/User', {
    findById: async (id) => {
      calls.push(`User.findById:${id}`);
      return userRecord;
    },
    deleteOne: async (q) => {
      maybeFail('User.deleteOne');
      calls.push(`User.deleteOne:${q._id}`);
    },
    exists: async () => true,
  });
  stubModule('models/Booking', {
    find: (q) => ({
      select: () => ({
        lean: async () => {
          calls.push(`Booking.find:${q.user}:${q.status}`);
          return confirmedBookings;
        },
      }),
    }),
    deleteMany: async (q) => {
      maybeFail('Booking.deleteMany');
      calls.push(`Booking.deleteMany:${q.user}`);
    },
  });
  stubModule('models/Notification', {
    deleteMany: async (q) => {
      maybeFail('Notification.deleteMany');
      calls.push(`Notification.deleteMany:${q.user}`);
    },
  });
  stubModule('services/socket', {
    emitBookingCancelled: (b) => calls.push(`emit:${b.reference}`),
  });

  // Fresh copies of the code under test, wired to the fakes above.
  delete require.cache[require.resolve(`${SRC}/services/accountDeletion`)];
  delete require.cache[require.resolve(`${SRC}/controllers/userController`)];
  return require(`${SRC}/controllers/userController`);
}

function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const makeUser = (overrides = {}) => ({
  _id: 'u1',
  role: 'customer',
  verifyPassword: async (pw) => pw === 'correct-horse',
  ...overrides,
});

const destructive = () => calls.filter((c) => /delete|emit/i.test(c));

test('rejects a request with no password and deletes nothing', async () => {
  userRecord = makeUser();
  confirmedBookings = [];
  const ctrl = installFakes();
  const res = makeRes();

  await ctrl.deleteAccount({ user: { id: 'u1' }, body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(destructive(), []);
});

test('rejects a non-string password (e.g. an object) without touching the database', async () => {
  userRecord = makeUser();
  confirmedBookings = [];
  const ctrl = installFakes();
  const res = makeRes();

  await ctrl.deleteAccount({ user: { id: 'u1' }, body: { password: { $ne: '' } } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(calls, []);
});

test('returns 404 when the account no longer exists', async () => {
  userRecord = null;
  confirmedBookings = [];
  const ctrl = installFakes();
  const res = makeRes();

  await ctrl.deleteAccount({ user: { id: 'gone' }, body: { password: 'correct-horse' } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(destructive(), []);
});

test('refuses to delete an admin account', async () => {
  userRecord = makeUser({ role: 'admin' });
  confirmedBookings = [];
  const ctrl = installFakes();
  const res = makeRes();

  await ctrl.deleteAccount({ user: { id: 'u1' }, body: { password: 'correct-horse' } }, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(destructive(), []);
});

test('rejects a wrong password and deletes nothing', async () => {
  userRecord = makeUser();
  confirmedBookings = [];
  const ctrl = installFakes();
  const res = makeRes();

  await ctrl.deleteAccount({ user: { id: 'u1' }, body: { password: 'wrong' } }, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(destructive(), []);
});

test('deletes bookings and notifications first, the user last, then frees held slots', async () => {
  userRecord = makeUser();
  confirmedBookings = [{ reference: 'HP-AAA' }, { reference: 'HP-BBB' }];
  const ctrl = installFakes();
  const res = makeRes();

  await ctrl.deleteAccount({ user: { id: 'u1' }, body: { password: 'correct-horse' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.deepEqual(destructive(), [
    'Booking.deleteMany:u1',
    'Notification.deleteMany:u1',
    'User.deleteOne:u1',
    'emit:HP-AAA',
    'emit:HP-BBB',
  ]);
  // Only CONFIRMED bookings hold a slot worth releasing.
  assert.ok(calls.includes('Booking.find:u1:Confirmed'));
});

test('a failure part-way keeps the user, so the request can be retried', async () => {
  userRecord = makeUser();
  confirmedBookings = [{ reference: 'HP-AAA' }];
  const ctrl = installFakes({ failOn: 'Notification.deleteMany' });
  const res = makeRes();

  await assert.rejects(
    ctrl.deleteAccount({ user: { id: 'u1' }, body: { password: 'correct-horse' } }, res),
    /Notification.deleteMany failed/,
  );

  assert.ok(!calls.some((c) => c.startsWith('User.deleteOne')), 'user must not be deleted yet');
  assert.ok(!calls.some((c) => c.startsWith('emit:')), 'no slots freed for a failed deletion');
});

test('a socket failure after deletion does not turn success into an error', async () => {
  userRecord = makeUser();
  confirmedBookings = [{ reference: 'HP-AAA' }];
  const ctrl = installFakes();
  stubModule('services/socket', {
    emitBookingCancelled: () => {
      throw new Error('socket down');
    },
  });
  delete require.cache[require.resolve(`${SRC}/services/accountDeletion`)];
  delete require.cache[require.resolve(`${SRC}/controllers/userController`)];
  const freshCtrl = require(`${SRC}/controllers/userController`);
  const res = makeRes();

  await freshCtrl.deleteAccount({ user: { id: 'u1' }, body: { password: 'correct-horse' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  void ctrl;
});
