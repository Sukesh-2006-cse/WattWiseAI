import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import {
  getBackendUrl,
  setBackendUrl,
  testBackendConnection,
} from '../services/apiService';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Server URL Configuration Modal & Status
  const [currentServerUrl, setCurrentServerUrl] = useState<string>('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [inputServerUrl, setInputServerUrl] = useState<string>('');
  const [testingServer, setTestingServer] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadServerConfig();
  }, []);

  const loadServerConfig = async () => {
    let url = await getBackendUrl();
    if (url.includes('10.10.39.4')) {
      url = await setBackendUrl('http://172.16.4.238:5000');
    }
    setCurrentServerUrl(url);
    setInputServerUrl(url);
    checkHealth(url);
  };

  const checkHealth = async (urlToCheck?: string) => {
    setServerStatus('checking');
    const res = await testBackendConnection(urlToCheck);
    setServerStatus(res.success ? 'online' : 'offline');
    return res;
  };

  const handleTestConnection = async () => {
    if (!inputServerUrl.trim()) return;
    setTestingServer(true);
    setTestResult(null);
    try {
      const res = await testBackendConnection(inputServerUrl.trim());
      setTestResult(res);
      if (res.success) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } finally {
      setTestingServer(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!inputServerUrl.trim()) return;
    const saved = await setBackendUrl(inputServerUrl.trim());
    setCurrentServerUrl(saved);
    setIsConfigModalOpen(false);
    setTestResult(null);
    checkHealth(saved);
  };

  const handleAuth = async () => {
    setErrorMessage('');

    if (isRegisterMode) {
      if (!name.trim()) {
        setErrorMessage('Please enter your User Name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid Email Address.');
        return;
      }
      if (!mobile.trim() || mobile.trim().length < 7) {
        setErrorMessage('Please enter a valid Mobile Number.');
        return;
      }
    } else {
      if (!email.trim()) {
        setErrorMessage('Please enter your registered Email or Mobile number.');
        return;
      }
    }

    try {
      setLoading(true);
      if (isRegisterMode) {
        await register(name.trim(), email.trim(), mobile.trim());
      } else {
        await login(email.trim());
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Authentication failed. Please check your connection or server status.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="flash" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>WattWise AI</Text>
            <Text style={styles.subtitle}>
              Smart Energy Monitoring & Load Alert System
            </Text>

            {/* Server Connection Status Pill */}
            <TouchableOpacity
              style={styles.serverPill}
              onPress={() => {
                setInputServerUrl(currentServerUrl);
                setTestResult(null);
                setIsConfigModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.statusDot,
                  serverStatus === 'online'
                    ? styles.dotOnline
                    : serverStatus === 'checking'
                    ? styles.dotChecking
                    : styles.dotOffline,
                ]}
              />
              <Text style={styles.serverPillText} numberOfLines={1}>
                {serverStatus === 'online'
                  ? 'Server Online'
                  : serverStatus === 'checking'
                  ? 'Connecting...'
                  : 'Server Unreachable'}
                {' • '}
                {currentServerUrl.replace(/^http:\/\//, '')}
              </Text>
              <Ionicons name="settings-outline" size={13} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isRegisterMode && styles.activeTab]}
              onPress={() => {
                setIsRegisterMode(true);
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isRegisterMode && styles.activeTabText]}>
                Register
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, !isRegisterMode && styles.activeTab]}
              onPress={() => {
                setIsRegisterMode(false);
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, !isRegisterMode && styles.activeTabText]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>
              {isRegisterMode ? 'Create New Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.cardHeaderDesc}>
              {isRegisterMode
                ? 'Enter your details to register for live alerts & telemetry tracking.'
                : 'Enter your registered Email or Mobile number to continue.'}
            </Text>

            {/* Error Banner */}
            {Boolean(errorMessage) && (
              <View style={styles.errorBanner}>
                <View style={styles.errorHeaderRow}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>

                {errorMessage.includes('Server') || errorMessage.includes('connect') ? (
                  <TouchableOpacity
                    style={styles.fixServerBtn}
                    onPress={() => {
                      setInputServerUrl(currentServerUrl);
                      setTestResult(null);
                      setIsConfigModalOpen(true);
                    }}
                  >
                    <Ionicons name="construct-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.fixServerBtnText}>Configure Server IP Address</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Name Input (Register Only) */}
            {isRegisterMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name / Username</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Sukesh"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {isRegisterMode ? 'Email Address (For Load Alerts)' : 'Email or Mobile Number'}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={isRegisterMode ? 'e.g. sukesh@safesignal.ai' : 'Enter email or mobile'}
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Mobile Number Input (Register Only) */}
            {isRegisterMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 7395895433"
                    placeholderTextColor={COLORS.textMuted}
                    value={mobile}
                    onChangeText={setMobile}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {isRegisterMode ? 'Register & Start Monitoring' : 'Log In'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {/* DB Note */}
            <View style={styles.dbNoteContainer}>
              <Ionicons name="cloud-done-outline" size={14} color={COLORS.primary} />
              <Text style={styles.dbNoteText}>
                Connected to MongoDB Atlas Database (`cluster0`)
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Server URL Configuration Modal */}
      <Modal
        visible={isConfigModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConfigModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="server-outline" size={22} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Backend Server Config</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsConfigModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Set the URL of your computer running the WattWise backend. Make sure your phone & computer share the same Wi-Fi.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Backend API URL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="link-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="http://172.16.4.238:5000"
                  placeholderTextColor={COLORS.textMuted}
                  value={inputServerUrl}
                  onChangeText={setInputServerUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Test Connection Button */}
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testingServer}
              activeOpacity={0.8}
            >
              {testingServer ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="pulse-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.testBtnText}>Test Connection</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Test Result Message */}
            {testResult && (
              <View
                style={[
                  styles.testResultBox,
                  testResult.success ? styles.testSuccess : styles.testFail,
                ]}
              >
                <Ionicons
                  name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={testResult.success ? COLORS.success : COLORS.danger}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.testResultText,
                    testResult.success ? { color: COLORS.success } : { color: COLORS.danger },
                  ]}
                >
                  {testResult.message}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsConfigModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.modalSaveBtnText}>Save & Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: COLORS.success,
  },
  dotChecking: {
    backgroundColor: '#F59E0B',
  },
  dotOffline: {
    backgroundColor: COLORS.danger,
  },
  serverPillText: {
    fontSize: 11,
    color: COLORS.textMuted,
    maxWidth: 240,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardHeaderDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  fixServerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 8,
    marginTop: 10,
  },
  fixServerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  submitBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dbNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  dbNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10,
    marginBottom: SPACING.md,
  },
  testBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  testSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  testFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  testResultText: {
    fontSize: 12,
    flex: 1,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
  },
  modalCancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.md,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
