/**
 * WattWise AI - Unauthenticated Stack (Sign In / Sign Up / Reset)
 *
 * Uses the same lightweight state-driven switching pattern as AppNavigator,
 * so no extra navigation dependency is introduced.
 */

import React, { useState } from 'react';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';

type AuthRoute = 'signIn' | 'signUp' | 'forgotPassword';

export const AuthNavigator: React.FC = () => {
  const [route, setRoute] = useState<AuthRoute>('signIn');

  switch (route) {
    case 'signUp':
      return <SignUpScreen onNavigateToSignIn={() => setRoute('signIn')} />;

    case 'forgotPassword':
      return <ForgotPasswordScreen onNavigateToSignIn={() => setRoute('signIn')} />;

    case 'signIn':
    default:
      return (
        <SignInScreen
          onNavigateToSignUp={() => setRoute('signUp')}
          onNavigateToForgotPassword={() => setRoute('forgotPassword')}
        />
      );
  }
};
