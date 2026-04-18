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

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Please fill in all fields' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Sign up failed', text2: error.message });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Welcome to Wellexus! 🌿',
        text2: 'Your account has been created.',
      });
      // DB trigger auto-creates users + nexi_stats rows.
      // onAuthStateChange in _layout.tsx redirects to /(tabs).
    }
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
              Join Wellexus
            </Text>
            <Text
              className="text-charcoal/50 text-sm mt-1 text-center"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Start your wellness journey today
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
                placeholder="At least 6 characters"
                placeholderTextColor="#1A1A2E50"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className="bg-mint rounded-2xl py-4 items-center mt-4"
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#1A1A2E" />
              ) : (
                <Text
                  className="text-charcoal text-lg"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Create Account
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
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text
                className="text-charcoal text-sm"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
