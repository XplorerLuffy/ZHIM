import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);

  if (!hasOnboarded) return <Redirect href="/(onboarding)" />;
  if (!session) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)" />;
}
