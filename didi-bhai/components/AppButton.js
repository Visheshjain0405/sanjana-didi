import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function AppButton({
  title,
  variant = 'primary',
  onPress,
  disabled = false,
  className = '',
  textClassName = '',
  children,
  ...props
}) {
  const isPrimary = variant === 'primary';

  const bgClass = isPrimary ? 'bg-primary' : 'bg-secondary';
  const textColorClass = isPrimary ? 'text-white' : 'text-text';
  const opacityClass = disabled ? 'opacity-50' : 'active:opacity-80';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      className={`py-3.5 px-6 rounded-2xl items-center justify-center ${bgClass} ${opacityClass} ${className}`}
      {...props}
    >
      {title ? (
        <Text className={`text-base font-bold ${textColorClass} ${textClassName}`}>
          {title}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
