/**
 * PTPText Component
 *
 * Custom text component that applies Inter font family
 * and PTP brand typography consistently.
 */

import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily, textStyles, TextStyleName } from '../theme/typography';

interface PTPTextProps extends TextProps {
  /**
   * Predefined text style variant
   */
  variant?: TextStyleName;
  /**
   * Text color (defaults to inkBlack)
   */
  color?: keyof typeof colors | string;
  /**
   * Center the text
   */
  center?: boolean;
  /**
   * Font weight override
   */
  weight?: keyof typeof fontFamily;
  /**
   * Children text content
   */
  children: React.ReactNode;
}

/**
 * PTPText - Branded text component with Inter font
 *
 * @example
 * <PTPText variant="heroTitle" color="primary">Welcome to PTP</PTPText>
 * <PTPText variant="body">Regular body text</PTPText>
 * <PTPText variant="caption" color="gray500">Small caption</PTPText>
 */
export const PTPText: React.FC<PTPTextProps> = ({
  variant = 'body',
  color = 'inkBlack',
  center = false,
  weight,
  style,
  children,
  ...props
}) => {
  // Get predefined text style
  const variantStyle = textStyles[variant];

  // Resolve color value
  const textColor = color in colors ? colors[color as keyof typeof colors] : color;

  // Override font weight if specified
  const fontWeight = weight ? fontFamily[weight] : variantStyle.fontFamily;

  return (
    <Text
      style={[
        variantStyle,
        { color: textColor, fontFamily: fontWeight },
        center && styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

/**
 * Specialized text components for common use cases
 */

export const PTPTitle: React.FC<Omit<PTPTextProps, 'variant'>> = (props) => (
  <PTPText variant="heroTitle" {...props} />
);

export const PTPHeading: React.FC<Omit<PTPTextProps, 'variant'>> = (props) => (
  <PTPText variant="sectionTitle" {...props} />
);

export const PTPSubheading: React.FC<Omit<PTPTextProps, 'variant'>> = (props) => (
  <PTPText variant="sectionSubtitle" color="gray500" {...props} />
);

export const PTPBody: React.FC<Omit<PTPTextProps, 'variant'>> = (props) => (
  <PTPText variant="body" {...props} />
);

export const PTPCaption: React.FC<Omit<PTPTextProps, 'variant'>> = (props) => (
  <PTPText variant="caption" color="gray500" {...props} />
);

export const PTPLabel: React.FC<Omit<PTPTextProps, 'variant'>> = (props) => (
  <PTPText variant="label" {...props} />
);

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});

export default PTPText;
