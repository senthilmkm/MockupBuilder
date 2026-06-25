import { useAlertsStore } from '../src/store/alertsStore';

describe('Zustand Alerts State Store', () => {
  beforeEach(() => {
    // Reset state before each test
    const { clearAlerts } = useAlertsStore.getState();
    clearAlerts();
  });

  test('should initialize with empty alerts list', () => {
    const state = useAlertsStore.getState();
    expect(state.alerts).toEqual([]);
  });

  test('should add a local system-generated alert', () => {
    const { addAlert } = useAlertsStore.getState();

    addAlert('Mockup Saved', 'Saved PNG mockup to your gallery.', 'Just now');

    const state = useAlertsStore.getState();
    expect(state.alerts).toHaveLength(1);
    expect(state.alerts[0].title).toBe('Mockup Saved');
    expect(state.alerts[0].body).toBe('Saved PNG mockup to your gallery.');
    expect(state.alerts[0].time).toBe('Just now');
    expect(state.alerts[0].isRead).toBe(false);
    expect(state.alerts[0].id).toBeDefined();
  });

  test('should toggle read/unread status for an alert', () => {
    const { addAlert, toggleRead } = useAlertsStore.getState();

    addAlert('Alert 1', 'Content 1');
    const alertId = useAlertsStore.getState().alerts[0].id;

    expect(useAlertsStore.getState().alerts[0].isRead).toBe(false);

    // Toggle to read
    toggleRead(alertId);
    expect(useAlertsStore.getState().alerts[0].isRead).toBe(true);

    // Toggle back to unread
    toggleRead(alertId);
    expect(useAlertsStore.getState().alerts[0].isRead).toBe(false);
  });

  test('should mark all alerts as read', () => {
    const { addAlert, markAllRead } = useAlertsStore.getState();

    addAlert('Alert 1', 'Content 1');
    addAlert('Alert 2', 'Content 2');

    expect(useAlertsStore.getState().alerts[0].isRead).toBe(false);
    expect(useAlertsStore.getState().alerts[1].isRead).toBe(false);

    markAllRead();

    const alerts = useAlertsStore.getState().alerts;
    expect(alerts[0].isRead).toBe(true);
    expect(alerts[1].isRead).toBe(true);
  });

  test('should delete an individual alert by id', () => {
    const { addAlert, deleteAlert } = useAlertsStore.getState();

    addAlert('Alert 1', 'Content 1');
    addAlert('Alert 2', 'Content 2');

    let alerts = useAlertsStore.getState().alerts;
    expect(alerts).toHaveLength(2);

    const deleteId = alerts[0].id;
    const keepId = alerts[1].id;

    deleteAlert(deleteId);

    alerts = useAlertsStore.getState().alerts;
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe(keepId);
  });

  test('should clear all alerts', () => {
    const { addAlert, clearAlerts } = useAlertsStore.getState();

    addAlert('Alert 1', 'Content 1');
    addAlert('Alert 2', 'Content 2');

    expect(useAlertsStore.getState().alerts).toHaveLength(2);

    clearAlerts();

    expect(useAlertsStore.getState().alerts).toHaveLength(0);
  });

  test('should sync remote alerts and prevent duplicates when run multiple times', async () => {
    const { syncRemoteAlerts } = useAlertsStore.getState();

    // Perform initial sync
    await syncRemoteAlerts();

    const initialAlerts = useAlertsStore.getState().alerts;
    expect(initialAlerts.length).toBeGreaterThan(0);

    const initialCount = initialAlerts.length;

    // Sync a second time
    await syncRemoteAlerts();

    const updatedAlerts = useAlertsStore.getState().alerts;
    expect(updatedAlerts.length).toBe(initialCount); // Count should not change as duplicates are prevented
  });

  test('should support and respect the enabled property for visibility filtering', async () => {
    const { syncRemoteAlerts, addAlert } = useAlertsStore.getState();

    // Sync remote alerts
    await syncRemoteAlerts();

    const alerts = useAlertsStore.getState().alerts;
    
    // Check that at least one is enabled and one is disabled based on alerts.json setup
    const enabledAlerts = alerts.filter(a => a.enabled !== false);
    const disabledAlerts = alerts.filter(a => a.enabled === false);

    expect(enabledAlerts.length).toBeGreaterThan(0);
    expect(disabledAlerts.length).toBeGreaterThan(0);

    // Verify local alert default is enabled
    addAlert('Local Test Alert', 'This should be enabled by default');
    const updatedAlerts = useAlertsStore.getState().alerts;
    const localAlert = updatedAlerts.find(a => a.title === 'Local Test Alert');
    expect(localAlert).toBeDefined();
    expect(localAlert?.enabled).toBe(true);
  });
});
