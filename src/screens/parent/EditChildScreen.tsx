/**
 * Edit Child Screen (Parent)
 *
 * Allows parents to add or edit a child/player profile.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParentStackParamList } from '../../types/navigation';
import { AgeBand, SkillLevel, PlayerPosition, ChildProfile } from '../../types';
import { useAuth, useParentUser } from '../../hooks/useAuth';
import { addChild, updateChild, deleteChild, ChildData } from '../../api/children';
import { PTPText, PTPButton, PTPInput } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type EditChildNavigationProp = NativeStackNavigationProp<ParentStackParamList>;
type EditChildRouteProp = RouteProp<ParentStackParamList, 'EditChild'>;

// Age band options
const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: '6-8', label: '6-8' },
  { value: '9-11', label: '9-11' },
  { value: '12-14', label: '12-14' },
  { value: '15-17', label: '15-17' },
  { value: '18+', label: '18+' },
];

// Skill level options
const SKILL_LEVELS: { value: SkillLevel; label: string; description: string }[] = [
  { value: 'rec', label: 'Recreational', description: 'Just starting out or playing for fun' },
  { value: 'travel', label: 'Travel/Club', description: 'Competitive travel or club team' },
  { value: 'elite', label: 'Elite', description: 'High-level competitive or academy' },
];

// Position options
const POSITIONS: { value: PlayerPosition; label: string }[] = [
  { value: 'goalkeeper', label: 'Goalkeeper' },
  { value: 'defender', label: 'Defender' },
  { value: 'midfielder', label: 'Midfielder' },
  { value: 'forward', label: 'Forward' },
  { value: 'all-around', label: 'All-around' },
  { value: 'undecided', label: 'Undecided' },
];

/**
 * EditChildScreen - Add or edit a child profile
 */
const EditChildScreen: React.FC = () => {
  const navigation = useNavigation<EditChildNavigationProp>();
  const route = useRoute<EditChildRouteProp>();
  const { refreshUser } = useAuth();
  const parentUser = useParentUser();

  const childId = route.params?.childId;
  const isEditing = !!childId;
  const existingChild = parentUser?.children?.find((c) => c.id === childId);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand>('9-11');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('rec');
  const [position, setPosition] = useState<PlayerPosition>('undecided');
  const [team, setTeam] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Populate form if editing
  useEffect(() => {
    if (existingChild) {
      setFirstName(existingChild.firstName || '');
      setLastName(existingChild.lastName || '');
      setDateOfBirth(existingChild.dateOfBirth || '');
      setAgeBand(existingChild.ageBand || '9-11');
      setSkillLevel(existingChild.skillLevel || 'rec');
      setPosition(existingChild.position || 'undecided');
      setTeam(existingChild.team || '');
      setNotes(existingChild.notes || '');
    }
  }, [existingChild]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      newErrors.dateOfBirth = 'Use format YYYY-MM-DD';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const childData: ChildData = {
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      ageBand,
      skillLevel,
      position,
      team: team.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEditing && childId) {
        await updateChild(childId, childData);
      } else {
        await addChild(childData);
      }

      // Refresh user data
      await refreshUser();

      Alert.alert(
        'Success',
        isEditing ? 'Player profile updated.' : 'Player added successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save player. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!childId) return;

    Alert.alert(
      'Delete Player',
      `Are you sure you want to remove ${firstName} from your account? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteChild(childId);
              await refreshUser();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete player. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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
          {/* Basic Information */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              BASIC INFORMATION
            </PTPText>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  First Name *
                </PTPText>
                <PTPInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>

              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Last Name
                </PTPText>
                <PTPInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Date of Birth
                </PTPText>
                <PTPInput
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  error={errors.dateOfBirth}
                />
              </View>
            </View>
          </View>

          {/* Age Band */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              AGE GROUP
            </PTPText>
            <View style={styles.card}>
              <View style={styles.optionRow}>
                {AGE_BANDS.map((band) => (
                  <TouchableOpacity
                    key={band.value}
                    style={[
                      styles.optionChip,
                      ageBand === band.value && styles.optionChipSelected,
                    ]}
                    onPress={() => setAgeBand(band.value)}
                  >
                    <PTPText
                      variant="label"
                      color={ageBand === band.value ? 'white' : 'gray600'}
                    >
                      {band.label}
                    </PTPText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Skill Level */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              SKILL LEVEL
            </PTPText>
            <View style={styles.card}>
              {SKILL_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.skillOption,
                    skillLevel === level.value && styles.skillOptionSelected,
                  ]}
                  onPress={() => setSkillLevel(level.value)}
                >
                  <View style={styles.skillOptionContent}>
                    <PTPText
                      variant="buttonMedium"
                      color={skillLevel === level.value ? 'primary' : 'inkBlack'}
                    >
                      {level.label}
                    </PTPText>
                    <PTPText variant="caption" color="gray500">
                      {level.description}
                    </PTPText>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      skillLevel === level.value && styles.radioOuterSelected,
                    ]}
                  >
                    {skillLevel === level.value && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Position */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              POSITION
            </PTPText>
            <View style={styles.card}>
              <View style={styles.optionGrid}>
                {POSITIONS.map((pos) => (
                  <TouchableOpacity
                    key={pos.value}
                    style={[
                      styles.positionChip,
                      position === pos.value && styles.optionChipSelected,
                    ]}
                    onPress={() => setPosition(pos.value)}
                  >
                    <PTPText
                      variant="caption"
                      color={position === pos.value ? 'white' : 'gray600'}
                    >
                      {pos.label}
                    </PTPText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              ADDITIONAL INFO
            </PTPText>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Team/Club Name
                </PTPText>
                <PTPInput
                  value={team}
                  onChangeText={setTeam}
                  placeholder="e.g., Main Line FC U10"
                />
              </View>

              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Notes for Trainers
                </PTPText>
                <PTPInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any goals, areas to improve, or things trainers should know..."
                  multiline
                  numberOfLines={3}
                  style={styles.textArea}
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <PTPButton
              title={isEditing ? 'Save Changes' : 'Add Player'}
              onPress={handleSave}
              loading={isLoading}
              fullWidth
            />
            <PTPButton
              title="Cancel"
              variant="outline"
              onPress={() => navigation.goBack()}
              fullWidth
              style={styles.cancelButton}
            />

            {isEditing && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                <PTPText variant="label" color="error">
                  {isDeleting ? 'Deleting...' : 'Delete Player'}
                </PTPText>
              </TouchableOpacity>
            )}
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
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    marginBottom: spacing[1],
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  optionChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
  },
  positionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  skillOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  skillOptionSelected: {
    borderBottomColor: colors.primary,
  },
  skillOptionContent: {
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[3],
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  cancelButton: {
    marginTop: spacing[3],
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginTop: spacing[4],
  },
});

export default EditChildScreen;
