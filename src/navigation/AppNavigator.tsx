/**
 * WattWise AI - Primary Navigation App Navigator
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { BillPredictionScreen } from '../screens/BillPredictionScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

type TabType = 'dashboard' | 'analytics' | 'billPrediction';

export const AppNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

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
      {/* Screen Body */}
      <View style={styles.screenContent}>{renderActiveScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
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
  screenContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-around',
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
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
