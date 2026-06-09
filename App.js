/**
 * ATTESTED — App Root
 * Auth gate → Tabs (Ratings, The Loop) with top-right account menu
 * → pushed pages (Account Info, Billing, Settings, Round History) + modals.
 */
import React from 'react';
import { StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StripeProvider } from '@stripe/stripe-react-native';
import { COLORS, FONTS } from './src/utils/theme';
import { useStore } from './src/services/store';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HoleDetailScreen from './src/screens/HoleDetailScreen';
import LoopScreen from './src/screens/LoopScreen';
import AccountInfoScreen from './src/screens/AccountInfoScreen';
import BillingScreen from './src/screens/BillingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RoundHistoryScreen from './src/screens/RoundHistoryScreen';
import PaymentScreen from './src/screens/PaymentScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DashStack = createNativeStackNavigator();

// TODO: Replace with your Stripe publishable key
const STRIPE_PUB_KEY = 'pk_test_REPLACE_WITH_YOUR_KEY';

/** Simple text tab icon (swap for @expo/vector-icons in production) */
function TabIcon({ glyph }) {
  return <Text style={{ fontSize: 21 }}>{glyph}</Text>;
}

/** Dashboard stack — Dashboard + HoleDetail push */
function DashboardStack() {
  return (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
      <DashStack.Screen name="DashboardMain" component={DashboardScreen} />
      <DashStack.Screen name="HoleDetail" component={HoleDetailScreen} />
    </DashStack.Navigator>
  );
}

/** Main tabs — shown after auth */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surfaceElevated,
          borderTopColor: COLORS.surfaceBorder,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 26,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.green700,
        tabBarInactiveTintColor: COLORS.gray500,
        tabBarLabelStyle: { ...FONTS.semibold, fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Ratings"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Ratings',
          tabBarIcon: () => <TabIcon glyph="⛳" />,
        }}
      />
      <Tab.Screen
        name="Loop"
        component={LoopScreen}
        options={{
          tabBarLabel: 'The Loop',
          tabBarIcon: () => <TabIcon glyph="🤝" />,
        }}
      />
    </Tab.Navigator>
  );
}

/** Root app with auth gate */
export default function App() {
  const isAuthenticated = useStore(s => s.isAuthenticated);

  return (
    <StripeProvider publishableKey={STRIPE_PUB_KEY}>
      <NavigationContainer
        theme={{
          dark: false,
          colors: {
            primary: COLORS.green500,
            background: COLORS.surface,
            card: COLORS.surfaceElevated,
            text: COLORS.ink,
            border: COLORS.surfaceBorder,
            notification: COLORS.green500,
          },
        }}
      >
        <StatusBar barStyle="dark-content" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              {/* Pages reached from the top-right account menu */}
              <Stack.Screen name="AccountInfo" component={AccountInfoScreen} />
              <Stack.Screen name="Billing" component={BillingScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="RoundHistory" component={RoundHistoryScreen} />
              <Stack.Screen
                name="Payment"
                component={PaymentScreen}
                options={{ presentation: 'modal' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
}
