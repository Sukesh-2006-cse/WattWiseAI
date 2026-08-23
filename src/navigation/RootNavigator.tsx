/**
 * WattWise AI - Root Auth Gate
 *
 * Decides between three states:
 *   1. Restoring a persisted session  -> splash
 *   2. No session                     -> auth stack (sign in / sign up)
 *   3. Signed in                      -> the monitoring app
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingView } from '../components/LoadingView';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

export const RootNavigator: React.FC = () => {
  const { initializing, isAuthenticated } = useAuth();

  if (initializing) {
    return <LoadingView message="Restoring your session..." />;
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
};
