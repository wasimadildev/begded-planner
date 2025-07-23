import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function AdminScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Admin Panel</Text>
      <Text style={{ marginBottom: 20 }}>Welcome, {user?.username}</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
