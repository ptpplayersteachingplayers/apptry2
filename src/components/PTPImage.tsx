import React, { useState, memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image, ImageProps, ImageContentFit } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '@theme/colors';
import { Skeleton } from './PTPSkeleton';

// Blur hash placeholder for smooth loading
const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface PTPImageProps {
  source: string | { uri: string };
  style?: ViewStyle;
  width?: number | string;
  height?: number | string;
  contentFit?: ImageContentFit;
  borderRadius?: number;
  placeholder?: string;
  showSkeleton?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const PTPImage: React.FC<PTPImageProps> = memo(({
  source,
  style,
  width,
  height,
  contentFit = 'cover',
  borderRadius = 0,
  placeholder = DEFAULT_BLURHASH,
  showSkeleton = true,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const uri = typeof source === 'string' ? source : source.uri;

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const containerStyle: ViewStyle = {
    width: width as any,
    height: height as any,
    borderRadius,
    overflow: 'hidden',
    ...(style as object),
  };

  if (hasError) {
    return (
      <View style={[containerStyle, styles.errorContainer]}>
        <View style={styles.errorIcon}>
          <View style={styles.errorIconInner} />
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {isLoading && showSkeleton && (
        <View style={StyleSheet.absoluteFill}>
          <Skeleton
            width="100%"
            height={typeof height === 'number' ? height : 200}
            borderRadius={borderRadius}
          />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[styles.image, { borderRadius }]}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={300}
        onLoad={handleLoad}
        onError={handleError}
        cachePolicy="memory-disk"
        recyclingKey={uri}
      />
    </View>
  );
});

// Avatar image with fallback
interface PTPAvatarProps {
  source?: string | { uri: string } | null;
  size?: number;
  name?: string;
  style?: ViewStyle;
}

export const PTPAvatar: React.FC<PTPAvatarProps> = memo(({
  source,
  size = 48,
  name,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const uri = typeof source === 'string' ? source : source?.uri;
  const showFallback = !uri || hasError;

  // Get initials from name
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (showFallback) {
    return (
      <View
        style={[
          styles.avatarFallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      >
        <Animated.Text
          entering={FadeIn}
          style={[styles.avatarText, { fontSize: size * 0.4 }]}
        >
          {initials}
        </Animated.Text>
      </View>
    );
  }

  return (
    <PTPImage
      source={uri!}
      width={size}
      height={size}
      borderRadius={size / 2}
      contentFit="cover"
      style={style}
      onError={() => setHasError(true)}
      showSkeleton={false}
    />
  );
});

// Hero image with gradient overlay
interface PTPHeroImageProps {
  source: string | { uri: string };
  height?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const PTPHeroImage: React.FC<PTPHeroImageProps> = memo(({
  source,
  height = 280,
  children,
  style,
}) => {
  return (
    <View style={[{ height }, style]}>
      <PTPImage
        source={source}
        width="100%"
        height={height}
        contentFit="cover"
      />
      {children && (
        <View style={styles.heroOverlay}>
          {children}
        </View>
      )}
    </View>
  );
});

// Gallery with lazy loading
interface PTPGalleryProps {
  images: string[];
  imageHeight?: number;
  style?: ViewStyle;
}

export const PTPGallery: React.FC<PTPGalleryProps> = memo(({
  images,
  imageHeight = 200,
  style,
}) => {
  return (
    <View style={[styles.gallery, style]}>
      {images.map((image, index) => (
        <PTPImage
          key={index}
          source={image}
          width="100%"
          height={imageHeight}
          borderRadius={12}
          style={styles.galleryImage}
        />
      ))}
    </View>
  );
});

PTPImage.displayName = 'PTPImage';
PTPAvatar.displayName = 'PTPAvatar';
PTPHeroImage.displayName = 'PTPHeroImage';
PTPGallery.displayName = 'PTPGallery';

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray300,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '600',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  gallery: {
    gap: 12,
  },
  galleryImage: {
    marginBottom: 12,
  },
});

export default PTPImage;
