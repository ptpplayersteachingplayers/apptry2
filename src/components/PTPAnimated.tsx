/**
 * PTPAnimated Components
 *
 * Animated components using React Native's built-in Animated API
 * for maximum compatibility with Expo Go.
 */

import React, { useEffect, useRef } from 'react';
import {
  ViewStyle,
  Pressable,
  Animated,
  Easing,
  View,
} from 'react-native';

// Animation presets (simplified for RN Animated)
export const animations = {
  fadeIn: { duration: 300 },
  fadeOut: { duration: 200 },
  slideInRight: { duration: 300 },
  slideInUp: { duration: 300 },
  slideOutRight: { duration: 200 },
  zoomIn: { duration: 300 },
  zoomOut: { duration: 200 },
};

// Animated pressable with scale effect
interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  scaleValue?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  disabled,
  style,
  scaleValue = 0.97,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleValue,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// Fade in view with optional delay
interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = 300,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Staggered list items
interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
}

export const StaggeredItem: React.FC<StaggeredItemProps> = ({
  children,
  index,
  style,
}) => {
  const delay = index * 50; // 50ms stagger

  return (
    <FadeInView delay={delay} style={style}>
      {children}
    </FadeInView>
  );
};

// Shake animation for errors
interface ShakeViewProps {
  children: React.ReactNode;
  shake?: boolean;
  style?: ViewStyle;
}

export const ShakeView: React.FC<ShakeViewProps> = ({
  children,
  shake,
  style,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shake) {
      Animated.sequence([
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [shake]);

  return (
    <Animated.View style={[style, { transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
};

// Pulse animation for loading or attention
interface PulseViewProps {
  children: React.ReactNode;
  active?: boolean;
  style?: ViewStyle;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  active = true,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      animation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      animation.current.start();
    } else {
      animation.current?.stop();
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }

    return () => {
      animation.current?.stop();
    };
  }, [active]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

// Slide in from bottom (for modals, bottom sheets)
interface SlideUpViewProps {
  children: React.ReactNode;
  visible: boolean;
  style?: ViewStyle;
}

export const SlideUpView: React.FC<SlideUpViewProps> = ({
  children,
  visible,
  style,
}) => {
  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Counter animation for numbers
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: ViewStyle;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.setValue(displayValue);
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration]);

  return <>{displayValue}</>;
};

// Progress bar animation
interface AnimatedProgressProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  height = 8,
  backgroundColor = '#E5E7EB',
  progressColor = '#FCB900',
  style,
}) => {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(width, {
      toValue: progress,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const animatedWidth = width.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        {
          height,
          backgroundColor,
          borderRadius: height / 2,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: progressColor,
          borderRadius: height / 2,
          width: animatedWidth,
        }}
      />
    </View>
  );
};

export default {
  AnimatedPressable,
  FadeInView,
  StaggeredItem,
  ShakeView,
  PulseView,
  SlideUpView,
  AnimatedCounter,
  AnimatedProgress,
  animations,
};
