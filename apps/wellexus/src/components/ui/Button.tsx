import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'mint';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const base = 'rounded-2xl py-4 items-center justify-center';
  const variants = {
    primary:   'bg-charcoal',
    secondary: 'bg-white border border-charcoal/20',
    mint:      'bg-mint',
  };
  const textColors = {
    primary:   'text-cream',
    secondary: 'text-charcoal',
    mint:      'text-charcoal',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50' : ''}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FAFAF7' : '#1A1A2E'} />
      ) : (
        <Text
          className={`text-base ${textColors[variant]}`}
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
