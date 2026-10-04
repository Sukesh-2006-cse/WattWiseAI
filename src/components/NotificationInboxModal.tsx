/**
 * WattWise AI - Notification Inbox Modal
 * Displays all received notifications, alert history, and time logs.
 * Supports deleting individual alerts, clearing all, and marking as read.
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  NotificationPayload,
  addNotificationHistoryListener,
  clearAllNotifications,
  deleteNotification,
  markAllNotificationsAsRead,
} from '../services/notificationService';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';

interface NotificationInboxModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationInboxModal: React.FC<NotificationInboxModalProps> = ({
  visible,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  useEffect(() => {
    const unsubscribe = addNotificationHistoryListener((history) => {
      setNotifications(history);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (visible) {
      markAllNotificationsAsRead().catch(() => {});
    }
  }, [visible]);

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to remove all saved alerts from your inbox?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAllNotifications(),
        },
      ]
    );
  };

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'OVER_CURRENT':
        return '#EF4444'; // Red
      case 'BILL_PREDICTION':
        return '#06B6D4'; // Cyan
      case 'VOLTAGE_ANOMALY':
        return '#F59E0B'; // Amber
      case 'LOAD_DISCONNECTED':
        return '#94A3B8'; // Slate
      case 'LOAD_DETECTED':
      default:
        return '#10B981'; // Emerald
    }
  };

  const getIconName = (type: string): any => {
    switch (type) {
      case 'OVER_CURRENT':
        return 'warning';
      case 'BILL_PREDICTION':
        return 'calculator';
      case 'VOLTAGE_ANOMALY':
        return 'flash';
      case 'LOAD_DISCONNECTED':
        return 'power';
      case 'LOAD_DETECTED':
      default:
        return 'bulb';
    }
  };

  const renderItem = ({ item }: { item: NotificationPayload }) => {
    const accent = getAccentColor(item.type);
    const icon = getIconName(item.type);

    return (
      <View style={[styles.itemCard, { borderLeftColor: accent }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}20` }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.itemTime}>{item.timestamp}</Text>
          </View>

          <Text style={styles.itemBody}>{item.body}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteNotification(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={15} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.bellBadge}>
                <Ionicons name="notifications" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Notification Box</Text>
                <Text style={styles.modalSubtitle}>
                  {notifications.length} received alert{notifications.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  style={styles.clearAllBtn}
                  onPress={handleClearAll}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={38} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptySubtitle}>
                Alerts from your smart meter (load detection, bill updates, overcurrent spikes) will be logged here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeModalBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '45%',
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderLeftWidth: 4,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  itemTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  itemBody: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  closeModalBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#0B0F14',
    fontSize: 14,
    fontWeight: '800',
  },
});
