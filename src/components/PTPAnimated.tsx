import React, { useEffect } from 'react';
import { ViewStyle, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInUp,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  Layout,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

// Animation presets
export const animations = {
  fadeIn: FadeIn.duration(300),
  fadeOut: FadeOut.duration(200),
  slideInRight: SlideInRight.duration(300),
  slideInUp: SlideInUp.duration(300),
  slideOutRight: SlideOutRight.duration(200),
  zoomIn: ZoomIn.duration(300),
  zoomOut: ZoomOut.duration(200),
  layout: Layout.springify(),
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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
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
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 20, stiffness: 200 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
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
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (shake) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [shake]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
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
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

// Import withRepeat for PulseView
import { withRepeat } from 'react-native-reanimated';

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
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
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
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  // Note: In a real app, you'd use a worklet to update this
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(Math.round(animatedValue.value));
    }, 16);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayValue(value);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
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
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(progress, { damping: 20, stiffness: 100 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <Animated.View
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
        style={[
          {
            height: '100%',
            backgroundColor: progressColor,
            borderRadius: height / 2,
          },
          animatedStyle,
        ]}
      />
    </Animated.View>
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
