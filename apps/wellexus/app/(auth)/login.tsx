import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Please fill in all fields' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Login failed', text2: error.message });
    }
    // On success, onAuthStateChange in _layout.tsx redirects to /(tabs)
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-cream"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-8 pt-20 pb-10">
          {/* Header */}
          <View className="items-center mb-12">
            <Text style={{ fontSize: 48 }}>🌿</Text>
            <Text
              className="text-4xl text-charcoal mt-3"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Wellexus
            </Text>
            <Text
              className="text-charcoal/50 text-sm mt-1"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Your Mood. Your Plan. Instantly.
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text
                className="text-charcoal/70 text-sm mb-2"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                Email
              </Text>
              <TextInput
                className="bg-white border border-mint rounded-2xl px-4 py-4 text-charcoal text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="you@example.com"
                placeholderTextColor="#1A1A2E50"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View>
              <Text
                className="text-charcoal/70 text-sm mb-2"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                Password
              </Text>
              <TextInput
                className="bg-white border border-mint rounded-2xl px-4 py-4 text-charcoal text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="••••••••"
                placeholderTextColor="#1A1A2E50"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-charcoal rounded-2xl py-4 items-center mt-4"
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FAFAF7" />
              ) : (
                <Text
                  className="text-cream text-lg"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-8">
            <Text
              className="text-charcoal/50 text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text
                className="text-charcoal text-sm"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
