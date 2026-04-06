import React, { useEffect } from 'react';
import { Text, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import TopBar    from './src/components/TopBar';
import Dashboard from './src/screens/Dashboard';
import Ventas    from './src/screens/Ventas';
import Productos from './src/screens/Productos';
import Gastos    from './src/screens/Gastos';
import Vendedores from './src/screens/Vendedores';
import Reparto   from './src/screens/Reparto';
import { pingBackend } from './src/services/api';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Inicio',     component: Dashboard,  icon: '🏠' },
  { name: 'Ventas',     component: Ventas,     icon: '🛒' },
  { name: 'Inventario', component: Productos,  icon: '📦' },
  { name: 'Gastos',     component: Gastos,     icon: '📤' },
  { name: 'Equipo',     component: Vendedores, icon: '👤' },
  { name: 'Reparto',    component: Reparto,    icon: '💵' },
];

function AppContent() {
  const { C, isDark } = useTheme();

  useEffect(() => {
    pingBackend();
    const interval = setInterval(pingBackend, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'light-content'}
        backgroundColor={C.moradoClaro}
      />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            header: () => <TopBar />,
            tabBarIcon: ({ focused }) => {
              const tab = TABS.find(t => t.name === route.name);
              return (
                <Text style={{ fontSize: focused ? 22 : 18 }}>{tab?.icon}</Text>
              );
            },
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginBottom: 2 }}>
                {route.name}
              </Text>
            ),
            tabBarActiveTintColor: C.morado,
            tabBarInactiveTintColor: C.textMuted,
            tabBarStyle: {
              backgroundColor: C.surface,
              borderTopColor: C.border,
              borderTopWidth: 1.5,
              height: 62,
              paddingTop: 4,
            },
          })}
        >
          {TABS.map(tab => (
            <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
          ))}
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
