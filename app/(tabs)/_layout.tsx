import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TransactionProvider } from '../context/TransactionContext';

export default function TabLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Wait for the component to mount before navigating
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (user?.role === 'admin') {
      router.replace('/admin');
    } else if (!user) {
      router.replace('/login');
    }
  }, [isMounted, user]);

  // Optional: Show nothing while redirecting
  if (!user || (user && user.role === 'admin')) {
    return null;
  }

  return (
    <TransactionProvider>
      <Tabs>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      </Tabs>
    </TransactionProvider>
  );
}
