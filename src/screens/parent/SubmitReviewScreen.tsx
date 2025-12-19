/**
 * Submit Review Screen (Parent)
 *
 * Allows parents to rate and review trainers after sessions.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { PTPText, PTPButton, PTPInput } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type SubmitReviewNavigationProp = NativeStackNavigationProp<ParentStackParamList>;
type SubmitReviewRouteProp = RouteProp<ParentStackParamList, 'SubmitReview'>;

const RATING_CATEGORIES = [
  { key: 'overall', label: 'Overall Experience', description: 'How was the session overall?' },
  { key: 'communication', label: 'Communication', description: 'Was the trainer clear and helpful?' },
  { key: 'technique', label: 'Technique & Skills', description: 'Quality of instruction?' },
  { key: 'punctuality', label: 'Punctuality', description: 'Was the trainer on time?' },
];

const SubmitReviewScreen: React.FC = () => {
  const navigation = useNavigation<SubmitReviewNavigationProp>();
  const route = useRoute<SubmitReviewRouteProp>();
  const { trainerId, sessionId } = route.params;

  const [ratings, setRatings] = useState<{ [key: string]: number }>({
    overall: 0,
    communication: 0,
    technique: 0,
    punctuality: 0,
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const handleRating = (category: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async () => {
    if (ratings.overall === 0) {
      Alert.alert('Rating Required', 'Please rate your overall experience.');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, this would call an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert(
        'Thank You!',
        'Your review has been submitted and will help other families find great trainers.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (category: string, currentRating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(category, star)}
            accessibilityLabel={`Rate ${star} stars`}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={32}
              color={star <= currentRating ? colors.primary : colors.gray300}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const averageRating = () => {
    const values = Object.values(ratings).filter((r) => r > 0);
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.averageRating}>
              <Ionicons name="star" size={40} color={colors.primary} />
              <PTPText variant="heroTitle" color="primary">
                {averageRating() || '-'}
              </PTPText>
            </View>
            <PTPText variant="sectionTitle" center>
              How was your session?
            </PTPText>
            <PTPText variant="body" color="gray500" center>
              Your feedback helps trainers improve and helps other families make informed decisions.
            </PTPText>
          </View>

          {/* Rating Categories */}
          {RATING_CATEGORIES.map((category) => (
            <View key={category.key} style={styles.ratingCard}>
              <PTPText variant="buttonMedium">{category.label}</PTPText>
              <PTPText variant="caption" color="gray500" style={styles.ratingDescription}>
                {category.description}
              </PTPText>
              {renderStars(category.key, ratings[category.key])}
            </View>
          ))}

          {/* Would Recommend */}
          <View style={styles.recommendSection}>
            <PTPText variant="buttonMedium">Would you recommend this trainer?</PTPText>
            <View style={styles.recommendButtons}>
              <TouchableOpacity
                style={[
                  styles.recommendButton,
                  wouldRecommend === true && styles.recommendButtonSelected,
                ]}
                onPress={() => setWouldRecommend(true)}
              >
                <Ionicons
                  name="thumbs-up"
                  size={24}
                  color={wouldRecommend === true ? colors.white : colors.success}
                />
                <PTPText
                  variant="label"
                  color={wouldRecommend === true ? 'white' : 'success'}
                  style={styles.recommendText}
                >
                  Yes
                </PTPText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.recommendButton,
                  wouldRecommend === false && styles.recommendButtonSelectedNo,
                ]}
                onPress={() => setWouldRecommend(false)}
              >
                <Ionicons
                  name="thumbs-down"
                  size={24}
                  color={wouldRecommend === false ? colors.white : colors.error}
                />
                <PTPText
                  variant="label"
                  color={wouldRecommend === false ? 'white' : 'error'}
                  style={styles.recommendText}
                >
                  No
                </PTPText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Written Review */}
          <View style={styles.commentSection}>
            <PTPText variant="buttonMedium">Share your experience (optional)</PTPText>
            <PTPText variant="caption" color="gray500" style={styles.commentHint}>
              What went well? What could be improved?
            </PTPText>
            <PTPInput
              value={comment}
              onChangeText={setComment}
              placeholder="Write your review here..."
              multiline
              numberOfLines={4}
              style={styles.commentInput}
            />
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <PTPButton
              title="Submit Review"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={ratings.overall === 0}
              fullWidth
            />
            <PTPButton
              title="Skip for Now"
              variant="ghost"
              onPress={() => navigation.goBack()}
              fullWidth
              style={styles.skipButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  header: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  ratingCard: {
    backgroundColor: colors.white,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  ratingDescription: {
    marginTop: spacing[1],
    marginBottom: spacing[3],
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
  },
  star: {
    marginHorizontal: spacing[1],
  },
  recommendSection: {
    backgroundColor: colors.white,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  recommendButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
    marginTop: spacing[3],
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.gray200,
    gap: spacing[2],
  },
  recommendButtonSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  recommendButtonSelectedNo: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  recommendText: {
    marginLeft: spacing[1],
  },
  commentSection: {
    backgroundColor: colors.white,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  commentHint: {
    marginTop: spacing[1],
    marginBottom: spacing[3],
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  skipButton: {
    marginTop: spacing[2],
  },
});

export default SubmitReviewScreen;
