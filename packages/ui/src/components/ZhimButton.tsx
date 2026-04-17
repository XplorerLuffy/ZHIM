import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, radii } from '../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ZhimButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function ZhimButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ZhimButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary[500] : colors.white}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              styles[`label_${variant}`],
              styles[`labelSize_${size}`],
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },

  // Variants
  primary: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  secondary: {
    backgroundColor: colors.secondary[500],
    borderColor: colors.secondary[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },

  // Sizes
  size_sm: { paddingHorizontal: spacing[3], paddingVertical: spacing[1] + 2, minHeight: 36 },
  size_md: { paddingHorizontal: spacing[5], paddingVertical: spacing[2] + 4, minHeight: 48 },
  size_lg: { paddingHorizontal: spacing[6], paddingVertical: spacing[3], minHeight: 56 },

  // Label base
  label: {
    fontFamily: typography.fontFamily.sansBold,
    letterSpacing: 0.2,
  },
  label_primary:   { color: colors.white },
  label_secondary: { color: colors.white },
  label_outline:   { color: colors.primary[500] },
  label_ghost:     { color: colors.primary[500] },
  label_danger:    { color: colors.white },

  labelSize_sm: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  labelSize_md: { fontSize: typography.fontSize.base, fontWeight: '700' },
  labelSize_lg: { fontSize: typography.fontSize.md, fontWeight: '700' },
});
