import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export function Card({ children, style, className = '' }: CardProps) {
  return (
    <View
      className={`bg-white rounded-3xl p-5 shadow-sm ${className}`}
      style={[{ shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }, style]}
    >
      {children}
    </View>
  );
}
