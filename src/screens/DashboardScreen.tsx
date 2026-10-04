/**
 * WattWise AI - Real-time Energy Dashboard Screen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ConnectionHeader } from '../components/ConnectionHeader';
import { EnergyChart } from '../components/EnergyChart';
import { ErrorView } from '../components/ErrorView';
import { LoadingView } from '../components/LoadingView';
import { MetricCard } from '../components/MetricCard';
import { LoadStatusCard, PowerClassificationCard } from '../components/StatusBadge';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useEnergyData } from '../hooks/useEnergyData';
import { useAuth } from '../context/AuthContext';
import { recordTelemetry } from '../services/apiService';
import {
  requestNotificationPermissions,
  notifyLoadDetected,
  notifyOvercurrentDetected,
  notifyBillPrediction,
  notifyLoadDisconnected,
  notifyVoltageAnomaly,
} from '../services/notificationService';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    data,
    loading,
    error,
    refresh,
    isConnected,
    lastUpdated,
    history,
    isConfigured,
  } = useEnergyData();

  const [refreshing, setRefreshing] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<string>('Syncing to MongoDB Atlas...');
  const [sendingNotification, setSendingNotification] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');
  const [showNotificationOptions, setShowNotificationOptions] = useState<boolean>(false);

  const lastRecordedKey = useRef<string>('');
  const lastLoadActiveRef = useRef<boolean | null>(null);
  const lastOvercurrentAlertRef = useRef<number>(0);

  // Request push notification permissions on mount
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Record telemetry in MongoDB Atlas & evaluate automated push alerts
  useEffect(() => {
    if (data && user) {
      const dataKey = `${data.voltage.toFixed(2)}-${data.current.toFixed(2)}-${data.status}`;
      
      // 1. Telemetry sync to MongoDB Atlas
      if (lastRecordedKey.current !== dataKey) {
        lastRecordedKey.current = dataKey;
        recordTelemetry(user, data)
          .then((res) => {
            setDbSyncStatus(`MongoDB Atlas Connected • Logged at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          })
          .catch(() => {
            setDbSyncStatus('MongoDB Sync Offline (Retrying...)');
          });
      }

      // 2. Automated Smart Push Notification Triggers based on real-time sensor stream
      const isCurrentLoadActive = data.current > 0.05;

      // A. Load Detected transition (Bulb turned ON)
      if (lastLoadActiveRef.current !== null && !lastLoadActiveRef.current && isCurrentLoadActive) {
        notifyLoadDetected(data.current, data.power);
        setNotificationMsg(`🔔 Push Alert Dispatched: 💡 Load Detected (${data.power.toFixed(1)}W)`);
      }

      // B. Load Disconnected transition (Bulb turned OFF)
      if (lastLoadActiveRef.current !== null && lastLoadActiveRef.current && !isCurrentLoadActive) {
        notifyLoadDisconnected();
        setNotificationMsg('🔔 Push Alert Dispatched: 🔌 Load Disconnected');
      }

      lastLoadActiveRef.current = isCurrentLoadActive;

      // C. Over Current Alert (threshold > 0.22A for 40W bulb test, debounced 30s)
      if (data.current > 0.22 && Date.now() - lastOvercurrentAlertRef.current > 30000) {
        lastOvercurrentAlertRef.current = Date.now();
        notifyOvercurrentDetected(data.current, 0.22);
        setNotificationMsg(`⚠️ Push Alert Dispatched: Overcurrent (${data.current.toFixed(3)}A)`);
      }
    }
  }, [data, user]);

  const handlePullToRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Trigger test notifications
  const handleTriggerTestPush = async (type: 'load' | 'overcurrent' | 'bill' | 'off' | 'voltage') => {
    try {
      setSendingNotification(true);
      setNotificationMsg('');

      if (type === 'load') {
        const c = data?.current || 0.174;
        const p = data?.power || 40.0;
        await notifyLoadDetected(c, p);
        setNotificationMsg(`🔔 Push notification sent: "💡 Load Detected (${p.toFixed(1)}W)"`);
      } else if (type === 'overcurrent') {
        const c = Math.max(0.245, (data?.current || 0) + 0.1);
        await notifyOvercurrentDetected(c, 0.22);
        setNotificationMsg(`⚠️ Push notification sent: "⚠️ Overcurrent Alert (${c.toFixed(3)}A)"`);
      } else if (type === 'bill') {
        await notifyBillPrediction(8.72, 0.0, true);
        setNotificationMsg('📊 Push notification sent: "📊 24h Bill & Energy Prediction (₹0.00)"');
      } else if (type === 'off') {
        await notifyLoadDisconnected();
        setNotificationMsg('🔌 Push notification sent: "🔌 Load Disconnected"');
      } else if (type === 'voltage') {
        const v = data?.voltage || 244.5;
        await notifyVoltageAnomaly(v);
        setNotificationMsg(`⚡ Push notification sent: "⚡ Grid Voltage Anomaly (${v.toFixed(1)}V)"`);
      }
    } catch (err: any) {
      setNotificationMsg(`Notification error: ${err.message}`);
    } finally {
      setSendingNotification(false);
    }
  };

  // Show full loading view only on initial load when data is missing
  if (loading && !data && !error) {
    return <LoadingView />;
  }

  // Show error view if fetch fails completely without existing data
  if (error && !data) {
    return <ErrorView errorMessage={error} onRetry={refresh} />;
  }

  const voltage = data?.voltage ?? 0;
  const current = data?.current ?? 0;
  const power = data?.power ?? 0;
  const energy = data?.energy ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullToRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Connection Header & Status */}
        <ConnectionHeader
          isConnected={isConnected}
          lastUpdated={lastUpdated}
          isConfigured={isConfigured}
        />

        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Voltage"
            value={voltage}
            unit="V"
            decimals={2}
            iconName="flash-outline"
            accentColor={COLORS.info}
            isSimulated={true}
            subtitle="Simulated Grid (220-230 V)"
          />

          <MetricCard
            title="Current"
            value={current}
            unit="A"
            decimals={4}
            iconName="speedometer-outline"
            accentColor={COLORS.secondary}
            subtitle="Phoenix 32A CT Hardware"
          />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title="Power"
            value={power}
            unit="W"
            decimals={2}
            iconName="pulse-outline"
            accentColor={COLORS.primary}
            subtitle="Calculated (V × I)"
          />

          <MetricCard
            title="Energy"
            value={energy}
            unit="kWh"
            decimals={5}
            iconName="leaf-outline"
            accentColor={COLORS.accent}
            subtitle="Accumulated Consumption"
          />
        </View>

        {/* Load Presence Status */}
        <LoadStatusCard currentAmps={current} />

        {/* Power Level Classification */}
        <PowerClassificationCard powerWatts={power} />

        {/* Live Consumption Power Chart */}
        <EnergyChart history={history} currentPower={power} />

        {/* --- BOTTOM OF PAGE: MongoDB Atlas Sync & Push Notification Alert Hub --- */}
        <View style={styles.bottomCardWrapper}>
          <View style={styles.syncCard}>
            <View style={styles.syncLeft}>
              <View style={styles.syncIconWrap}>
                <Ionicons name="cloud-done" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.syncTextGroup}>
                <Text style={styles.syncTitle} numberOfLines={1}>
                  MongoDB Atlas • Live Sync
                </Text>
                <Text style={styles.syncSubtitle} numberOfLines={1}>
                  {dbSyncStatus}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.testAlertBtn}
              onPress={() => setShowNotificationOptions(!showNotificationOptions)}
              disabled={sendingNotification}
              activeOpacity={0.7}
            >
              {sendingNotification ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="notifications" size={14} color="#FFFFFF" />
                  <Text style={styles.testAlertBtnText}>Test Alerts</Text>
                  <Ionicons
                    name={showNotificationOptions ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color="#FFFFFF"
                    style={{ marginLeft: 2 }}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Expandable Notification Options Drawer */}
          {showNotificationOptions && (
            <View style={styles.alertOptionsContainer}>
              <Text style={styles.alertOptionsTitle}>
                TAP TO TRIGGER A TEST PUSH NOTIFICATION (100% FREE IN EXPO GO):
              </Text>

              <View style={styles.chipGrid}>
                <TouchableOpacity
                  style={styles.alertChip}
                  onPress={() => handleTriggerTestPush('load')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bulb-outline" size={14} color="#FBBF24" style={{ marginRight: 4 }} />
                  <Text style={styles.alertChipText}>1. Load Detected</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.alertChip, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}
                  onPress={() => handleTriggerTestPush('overcurrent')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="warning-outline" size={14} color={COLORS.danger} style={{ marginRight: 4 }} />
                  <Text style={[styles.alertChipText, { color: '#F87171' }]}>2. Over Current</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.alertChip, { borderColor: 'rgba(34, 197, 94, 0.4)' }]}
                  onPress={() => handleTriggerTestPush('bill')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calculator-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.alertChipText, { color: '#4ADE80' }]}>3. 24h Bill Pred.</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertChip}
                  onPress={() => handleTriggerTestPush('off')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="power-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.alertChipText, { color: COLORS.textMuted }]}>4. Load OFF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.alertChip, { borderColor: 'rgba(6, 182, 212, 0.4)' }]}
                  onPress={() => handleTriggerTestPush('voltage')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flash-outline" size={14} color={COLORS.info} style={{ marginRight: 4 }} />
                  <Text style={[styles.alertChipText, { color: COLORS.info }]}>5. Voltage Anomaly</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Feedback Banner */}
          {Boolean(notificationMsg) && (
            <View style={styles.notificationBanner}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.notificationBannerText}>{notificationMsg}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  bottomCardWrapper: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  syncIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  syncTextGroup: {
    flex: 1,
  },
  syncTitle: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  syncSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  testAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
  },
  testAlertBtnText: {
    color: '#0B0F14',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 5,
    marginRight: 2,
  },
  alertOptionsContainer: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    marginTop: 8,
  },
  alertOptionsTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  alertChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    padding: 10,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  notificationBannerText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
});
