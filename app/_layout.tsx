import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';

export default function Layout() {
  return (
    <AuthProvider>
      <TransactionProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </TransactionProvider>
    </AuthProvider>
  );
}
