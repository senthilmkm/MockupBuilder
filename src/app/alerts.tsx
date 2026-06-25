import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/services/haptics';
import { useAlertsStore } from '@/store/alertsStore';

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { alerts, markAllRead, toggleRead, deleteAlert, clearAlerts, syncRemoteAlerts } = useAlertsStore();
  const visibleAlerts = alerts.filter((item) => item.enabled !== false);

  useEffect(() => {
    // Run simulated remote JSON sync on mount
    syncRemoteAlerts();
  }, []);

  const handleMarkAllRead = () => {
    haptics.mediumImpact();
    markAllRead();
  };

  const handleClearAll = () => {
    haptics.mediumImpact();
    clearAlerts();
  };

  const handleToggleRead = (id: string) => {
    haptics.lightImpact();
    toggleRead(id);
  };

  const handleDeleteAlert = (id: string) => {
    haptics.mediumImpact();
    deleteAlert(id);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { haptics.lightImpact(); router.back(); }}>
          <Text style={styles.backText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts Center</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerRightBtn}>
            <Text style={styles.readAllText}>Read All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} style={styles.headerRightBtn}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {visibleAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No alerts at the moment.</Text>
          </View>
        ) : (
          visibleAlerts.map((item) => (
            <View key={item.id} style={styles.alertCardWrapper}>
              <TouchableOpacity 
                style={[styles.alertCard, !item.isRead && styles.alertUnread]}
                onPress={() => handleToggleRead(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.alertHeaderRow}>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.alertBody}>{item.body}</Text>
                <Text style={styles.alertTime}>{item.time}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.deleteAlertBtn}
                onPress={() => handleDeleteAlert(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteIconText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Quick config redirect */}
        <View style={styles.configCard}>
          <Text style={styles.configText}>Want to adjust your notification preferences?</Text>
          <TouchableOpacity 
            style={styles.configBtn}
            onPress={() => {
              haptics.lightImpact();
              router.replace('/settings');
            }}
          >
            <Text style={styles.configBtnText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  backText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRightBtn: {
    marginLeft: 12,
  },
  readAllText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  clearAllText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollList: {
    flex: 1,
    padding: 16,
  },
  alertCardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  alertUnread: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  alertBody: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  alertTime: {
    color: '#64748B',
    fontSize: 11,
  },
  deleteAlertBtn: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  deleteIconText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  // Config promo block
  configCard: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  configText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  configBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  configBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
