import React from 'react';
import { View } from 'react-native';

export default function AppCard({
  children,
  className = '',
  style,
  ...props
}) {
  return (
    <View
      className={`bg-card p-6 rounded-3xl shadow-sm ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
