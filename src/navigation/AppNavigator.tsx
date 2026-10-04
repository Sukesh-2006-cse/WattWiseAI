/**
 * WattWise AI - Primary Navigation App Navigator
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { BillPredictionScreen } from '../screens/BillPredictionScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { useAuth } from '../context/AuthContext';

type TabType = 'dashboard' | 'analytics' | 'billPrediction';

export const AppNavigator: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading WattWise AI Session...</Text>
      </View>
    );
  }

  // If no logged in user, show Auth Screen
  if (!user) {
    return <AuthScreen />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'billPrediction':
        return <BillPredictionScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Container for Status Bar */}
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        {/* App Header with Logged In User Profile & Logout */}
        <View style={styles.headerBar}>
          <View style={styles.userProfileInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>
                {(user.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.userNameText} numberOfLines={1} ellipsizeMode="tail">
                {user.name}
              </Text>
              <Text style={styles.userEmailText} numberOfLines={1} ellipsizeMode="tail">
                {user.email}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Screen Body */}
      <View style={styles.screenContent}>{renderActiveScreen()}</View>

      {/* Bottom Navigation Bar with Safe Area Bottom Inset */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dashboard' && styles.activeTabItem]}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
            size={20}
            color={activeTab === 'dashboard' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'dashboard' ? COLORS.primary : COLORS.textMuted },
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'analytics' && styles.activeTabItem]}
          onPress={() => setActiveTab('analytics')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'analytics' ? 'stats-chart' : 'stats-chart-outline'}
            size={20}
            color={activeTab === 'analytics' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'analytics' ? COLORS.primary : COLORS.textMuted },
            ]}
          >
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'billPrediction' && styles.activeTabItem]}
          onPress={() => setActiveTab('billPrediction')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'billPrediction' ? 'calculator' : 'calculator-outline'}
            size={20}
            color={activeTab === 'billPrediction' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'billPrediction' ? COLORS.primary : COLORS.textMuted },
            ]}
          >
            Bill & AI
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topSafeArea: {
    backgroundColor: COLORS.cardBackground,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  userProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  userTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userEmailText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  logoutText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 5,
    fontWeight: '600',
  },
  screenContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 8,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  activeTabItem: {
    backgroundColor: COLORS.primaryGlow,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
});
