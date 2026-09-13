import React from 'react';
import { Text } from 'react-native';

export default function AppText({
  children,
  variant = 'body',
  muted = false,
  className = '',
  style,
  ...props
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'title':
        return 'text-3xl font-bold';
      case 'heading':
        return 'text-xl font-bold';
      case 'subheading':
        return 'text-lg font-semibold';
      case 'small':
        return 'text-sm';
      case 'body':
      default:
        return 'text-base';
    }
  };

  const colorClass = muted || variant === 'small' ? 'text-muted' : 'text-text';
  const combinedClasses = `${getVariantClasses()} ${colorClass} ${className}`.trim();

  return (
    <Text className={combinedClasses} style={style} {...props}>
      {children}
    </Text>
  );
}
