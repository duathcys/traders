const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const helperStart = appSource.indexOf('async function leaveSharedWaitlist(');
const helperEnd = appSource.indexOf('\nasync function markBarcodeIssued', helperStart);
assert.notEqual(helperStart, -1, 'leaveSharedWaitlist helper should exist');
assert.notEqual(helperEnd, -1, 'leaveSharedWaitlist helper should have an end marker');
const helperSource = appSource.slice(helperStart, helperEnd);
const syncStart = appSource.indexOf('async function syncSharedData(');
const syncEnd = appSource.indexOf('\nfunction toast', syncStart);
assert.notEqual(syncStart, -1, 'syncSharedData function should exist');
assert.notEqual(syncEnd, -1, 'syncSharedData function should have an end marker');
const syncSource = appSource.slice(syncStart, syncEnd);
const orderPredicateLine = appSource.match(/^const isOrderInRound = .*;$/m)?.[0];
assert.ok(orderPredicateLine, 'round-scoped order predicate should exist');
const orderPredicateContext = {};
vm.runInNewContext(`${orderPredicateLine}; globalThis.isOrderInRound=isOrderInRound;`, orderPredicateContext);

function createHarness({ rpcResult, refresh }) {
  const events = [];
  const state = {
    waitlist: [{ pid: 42, qty: 1 }],
    pending: [],
    modal: null,
  };
  const button = { disabled: false, textContent: '대기 취소' };
  const context = {
    state,
    dbRpc: async (name, args) => {
      assert.equal(name, 'leave_share_waitlist');
      assert.equal(args.p_product_id, 42);
      return rpcResult;
    },
    syncSharedData: async () => refresh(state),
    render: () => events.push('render'),
    showShareAlert: message => {
      state.modal = { type: 'share-alert', message };
      events.push('share-alert');
    },
    toast: message => events.push(`toast:${message}`),
  };
  vm.runInNewContext(helperSource, context);
  return { state, button, events, leave: context.leaveSharedWaitlist };
}

test('successful cancellation removes the row even if the follow-up refresh fails', async () => {
  const harness = createHarness({ rpcResult: true, refresh: async () => { throw new Error('temporary refresh failure'); } });
  await harness.leave(42, harness.button);

  assert.equal(harness.state.waitlist.length, 0);
  assert.equal(harness.state.modal.title, '대기 취소 완료');
  assert.equal(harness.button.disabled, false);
  assert.equal(harness.button.textContent, '대기 취소');
  assert.deepEqual(harness.events, ['render', 'render']);
});

test('a cancellation that lost a race to promotion shows the promotion alert', async () => {
  const harness = createHarness({
    rpcResult: false,
    refresh: async state => { state.waitlist = []; state.pending = [{ pid: 42 }]; },
  });
  await harness.leave(42, harness.button);

  assert.equal(harness.state.modal.type, 'share-alert');
  assert.match(harness.state.modal.message, /이미 새 모집에 참여/);
  assert.equal(harness.button.disabled, false);
});

test('a false cancellation result keeps the row and explains that it remains waiting', async () => {
  const harness = createHarness({ rpcResult: false, refresh: async () => {} });
  await harness.leave(42, harness.button);

  assert.equal(harness.state.waitlist.length, 1);
  assert.equal(harness.state.modal.title, '대기를 취소하지 못했어요');
  assert.match(harness.state.modal.message, /다시 시도/);
});

test('a slow older refresh cannot restore a stale waitlist row', async () => {
  let releaseOldWaitlist;
  let waitlistReads = 0;
  const oldWaitlistRequest = new Promise(resolve => { releaseOldWaitlist = resolve; });
  const state = {
    session: { user: { id: 'user-1' } },
    pending: [], cart: [], issued: [], completed: [], waitlist: [{ pid: 42 }],
    rounds: [], modal: null, view: 'reserve',
  };
  const context = {
    state,
    sharedSyncVersion: 0,
    dbRequest: path => {
      if (path.startsWith('share_round_progress')) return Promise.resolve([]);
      if (path.startsWith('share_waitlist?')) {
        waitlistReads += 1;
        return waitlistReads === 1 ? oldWaitlistRequest : Promise.resolve([]);
      }
      return Promise.resolve([]);
    },
    syncHomeAuth: () => {},
    render: () => {},
    showShareAlert: () => {},
    toast: () => {},
  };
  vm.runInNewContext(syncSource, context);

  const oldRefresh = context.syncSharedData({ quiet: true });
  await context.syncSharedData({ quiet: true });
  releaseOldWaitlist([{ id: 1, product_id: 42, qty: 1, amount: 100 }]);
  await oldRefresh;

  assert.equal(state.waitlist.length, 0);
});

test('an order from a different round does not count as already joined', () => {
  const order = { pid: 42, roundId: 17 };
  assert.equal(orderPredicateContext.isOrderInRound(order, 42, 18), false);
  assert.equal(orderPredicateContext.isOrderInRound(order, 42, '17'), true);
});
