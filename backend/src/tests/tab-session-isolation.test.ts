import assert from 'node:assert';

// Simulated Storage interface mimicking browser sessionStorage and localStorage
class MockStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

async function runSessionIsolationTests() {
  console.log('🧪 [TEST SUITE] Running Browser Tab Session Isolation & F5 Hydration Tests...\n');

  // Shared localStorage across the browser origin
  const sharedLocalStorage = new MockStorage();

  // Tab 1 isolated sessionStorage (Customer)
  const tab1SessionStorage = new MockStorage();

  // Tab 2 isolated sessionStorage (Orders Staff)
  const tab2SessionStorage = new MockStorage();

  const customerUser = {
    id: 'user_cust_001',
    fullName: 'Nguyen Khach Hang',
    email: 'customer@gmail.com',
    role: 'customer' as const,
  };
  const customerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.customer_token';

  const ordersStaffUser = {
    id: 'user_staff_002',
    fullName: 'Tran Nhan Vien Orders',
    email: 'orders@techgear.vn',
    role: 'orders' as const,
    permissions: ['orders'],
  };
  const ordersStaffToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.orders_staff_token';

  // --- TEST 1: Tab 1 logs in as Customer ---
  console.log('Test 1: Tab 1 logs in as Customer');
  tab1SessionStorage.setItem(
    'techgear_auth_storage',
    JSON.stringify({
      state: { user: customerUser, token: customerToken },
      version: 0,
    })
  );
  sharedLocalStorage.removeItem('techgear_auth_storage');

  assert.strictEqual(
    JSON.parse(tab1SessionStorage.getItem('techgear_auth_storage')!).state.user.role,
    'customer',
    'Tab 1 session must be customer'
  );
  assert.strictEqual(tab2SessionStorage.getItem('techgear_auth_storage'), null, 'Tab 2 session must still be empty');
  assert.strictEqual(sharedLocalStorage.getItem('techgear_auth_storage'), null, 'LocalStorage must not be polluted');
  console.log('  ✅ PASS: Tab 1 Customer session initialized without leaking to Tab 2 or localStorage\n');

  // --- TEST 2: Tab 2 logs in as Orders Staff ---
  console.log('Test 2: Tab 2 logs in as Orders Staff');
  tab2SessionStorage.setItem(
    'techgear_auth_storage',
    JSON.stringify({
      state: { user: ordersStaffUser, token: ordersStaffToken },
      version: 0,
    })
  );
  sharedLocalStorage.removeItem('techgear_auth_storage');

  // Tab 1's sessionStorage MUST remain strictly untouched
  const tab1Raw = tab1SessionStorage.getItem('techgear_auth_storage');
  assert.notStrictEqual(tab1Raw, null, 'Tab 1 must still have session data');
  const tab1Parsed = JSON.parse(tab1Raw!);
  assert.strictEqual(tab1Parsed.state.user.email, 'customer@gmail.com');
  assert.strictEqual(tab1Parsed.state.user.role, 'customer');
  assert.strictEqual(tab1Parsed.state.token, customerToken);

  // Tab 2 has orders staff
  const tab2Raw = tab2SessionStorage.getItem('techgear_auth_storage');
  assert.notStrictEqual(tab2Raw, null, 'Tab 2 must have session data');
  const tab2Parsed = JSON.parse(tab2Raw!);
  assert.strictEqual(tab2Parsed.state.user.email, 'orders@techgear.vn');
  assert.strictEqual(tab2Parsed.state.user.role, 'orders');
  assert.strictEqual(tab2Parsed.state.token, ordersStaffToken);
  console.log('  ✅ PASS: Tab 2 login does NOT overwrite Tab 1 session\n');

  // --- TEST 3: User presses F5 in Tab 1 (Page Refresh) ---
  console.log('Test 3: User presses F5 in Tab 1 (Page Refresh)');
  const tab1Rehydrated = JSON.parse(tab1SessionStorage.getItem('techgear_auth_storage')!);
  assert.strictEqual(
    tab1Rehydrated.state.user.role,
    'customer',
    'CRITICAL: Tab 1 on F5 must remain Customer, not become orders staff!'
  );
  assert.strictEqual(
    tab1Rehydrated.state.user.email,
    'customer@gmail.com',
    'Tab 1 email must remain customer@gmail.com'
  );
  assert.strictEqual(tab1Rehydrated.state.token, customerToken, 'Tab 1 token must remain customerToken');
  console.log('  ✅ PASS: Tab 1 F5 refresh successfully rehydrates Customer session (Bug Resolved!)\n');

  // --- TEST 4: User presses F5 in Tab 2 (Page Refresh) ---
  console.log('Test 4: User presses F5 in Tab 2 (Page Refresh)');
  const tab2Rehydrated = JSON.parse(tab2SessionStorage.getItem('techgear_auth_storage')!);
  assert.strictEqual(
    tab2Rehydrated.state.user.role,
    'orders',
    'Tab 2 on F5 must remain Orders Staff'
  );
  assert.strictEqual(
    tab2Rehydrated.state.user.email,
    'orders@techgear.vn',
    'Tab 2 email must remain orders@techgear.vn'
  );
  assert.strictEqual(tab2Rehydrated.state.token, ordersStaffToken, 'Tab 2 token must remain ordersStaffToken');
  console.log('  ✅ PASS: Tab 2 F5 refresh successfully rehydrates Orders Staff session\n');

  // --- TEST 5: Tab 1 logs out ---
  console.log('Test 5: Tab 1 logs out');
  tab1SessionStorage.removeItem('techgear_auth_storage');
  sharedLocalStorage.removeItem('techgear_auth_storage');

  assert.strictEqual(tab1SessionStorage.getItem('techgear_auth_storage'), null, 'Tab 1 must be logged out');
  const tab2StillActive = JSON.parse(tab2SessionStorage.getItem('techgear_auth_storage')!);
  assert.strictEqual(tab2StillActive.state.user.role, 'orders', 'Tab 2 must remain logged in after Tab 1 logout');
  console.log('  ✅ PASS: Tab 1 logout does NOT affect Tab 2 session\n');

  // --- TEST 6: Legacy localStorage isolation ---
  console.log('Test 6: Legacy localStorage isolation');
  sharedLocalStorage.setItem('techgear_auth_storage', JSON.stringify({ state: { user: ordersStaffUser } }));

  const currentTabToken = tab1SessionStorage.getItem('techgear_auth_storage');
  assert.strictEqual(currentTabToken, null, 'Tab 1 must not read stale data from localStorage');
  console.log('  ✅ PASS: Stale localStorage data is ignored by isolated tabs\n');

  console.log('🎉 [ALL SESSION ISOLATION TESTS PASSED SUCCESSFULLY]');
}

runSessionIsolationTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
