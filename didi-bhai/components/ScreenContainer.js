import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenContainer({
  children,
  scrollable = false,
  className = '',
  contentContainerClassName = '',
  style,
  ...props
}) {
  if (scrollable) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <ScrollView
          className={`flex-1 bg-background ${className}`}
          contentContainerClassName={`px-5 py-6 pb-12 ${contentContainerClassName}`}
          showsVerticalScrollIndicator={false}
          style={style}
          {...props}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View
        className={`flex-1 bg-background px-5 justify-center ${className}`}
        style={style}
        {...props}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
