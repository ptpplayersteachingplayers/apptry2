/**
 * Student Detail Screen (Trainer)
 *
 * Shows detailed information about a student/player the trainer has worked with.
 * Includes session history and notes.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TrainerStackParamList } from '../../types/navigation';
import { ChildProfile, TrainingSession } from '../../types';
import { getTrainerStudents, getMySessions } from '../../api/training';
import { PTPText, PTPButton, PTPLoading } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type StudentDetailRouteProp = RouteProp<TrainerStackParamList, 'StudentDetail'>;
type StudentDetailNavigationProp = NativeStackNavigationProp<TrainerStackParamList>;

interface StudentData {
  child: ChildProfile;
  parentName: string;
  parentEmail?: string;
  totalSessions: number;
  lastSession?: string;
}

/**
 * StudentDetailScreen - View student profile and session history
 */
const StudentDetailScreen: React.FC = () => {
  const navigation = useNavigation<StudentDetailNavigationProp>();
  const route = useRoute<StudentDetailRouteProp>();
  const { studentId } = route.params;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      // Get all students and find the one we need
      const students = await getTrainerStudents();
      const studentData = students.find((s: any) => s.child?.id === studentId);

      if (studentData) {
        setStudent({
          child: studentData.child,
          parentName: studentData.parent_name || 'Parent',
          parentEmail: studentData.parent_email,
          totalSessions: studentData.total_sessions || 0,
          lastSession: studentData.last_session,
        });
      }

      // Get session history with this student
      const allSessions = await getMySessions('all');
      const studentSessions = allSessions.filter(
        (s) => s.childId === studentId
      );
      setSessions(studentSessions);
    } catch (error) {
      console.error('Failed to load student data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionPress = (sessionId: number) => {
    navigation.navigate('SessionDetail', { sessionId });
  };

  const handleMessageParent = () => {
    // Navigate to messages - in a real app, find or create conversation
    navigation.navigate('ConversationDetail', { conversationId: studentId });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'confirmed':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.gray500;
    }
  };

  const renderSessionItem = ({ item }: { item: TrainingSession }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => handleSessionPress(item.id)}
    >
      <View style={styles.sessionDate}>
        <PTPText variant="buttonMedium">{formatDate(item.date)}</PTPText>
        <PTPText variant="caption" color="gray500">
          {item.startTime} - {item.endTime}
        </PTPText>
      </View>
      <View style={styles.sessionInfo}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <PTPText variant="caption" color="gray500" style={styles.statusText}>
          {item.status}
        </PTPText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return <PTPLoading message="Loading student..." />;
  }

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <PTPText variant="sectionTitle">Student Not Found</PTPText>
        <PTPButton title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Player Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <PTPText style={styles.avatarText}>
              {student.child.firstName[0]}
            </PTPText>
          </View>
          <PTPText variant="sectionTitle">{student.child.firstName}</PTPText>
          <PTPText variant="body" color="gray500">
            Parent: {student.parentName}
          </PTPText>
        </View>

        {/* Player Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <PTPText variant="sectionTitle" color="primary">
              {student.totalSessions}
            </PTPText>
            <PTPText variant="caption" color="gray500">Sessions</PTPText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <PTPText variant="buttonMedium">{student.child.ageBand}</PTPText>
            <PTPText variant="caption" color="gray500">Age Group</PTPText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <PTPText variant="buttonMedium">{student.child.skillLevel}</PTPText>
            <PTPText variant="caption" color="gray500">Level</PTPText>
          </View>
        </View>

        {/* Player Details */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            PLAYER DETAILS
          </PTPText>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <PTPText variant="body" color="gray500">Position</PTPText>
              <PTPText variant="buttonMedium">
                {student.child.position || 'Not specified'}
              </PTPText>
            </View>
            <View style={styles.detailRow}>
              <PTPText variant="body" color="gray500">Team</PTPText>
              <PTPText variant="buttonMedium">
                {student.child.team || 'Not specified'}
              </PTPText>
            </View>
            {student.child.notes && (
              <View style={styles.notesRow}>
                <PTPText variant="body" color="gray500">Notes from Parent</PTPText>
                <PTPText variant="body" color="gray600" style={styles.notesText}>
                  {student.child.notes}
                </PTPText>
              </View>
            )}
          </View>
        </View>

        {/* Session History */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            SESSION HISTORY
          </PTPText>
          {sessions.length > 0 ? (
            <View style={styles.card}>
              {sessions.map((session, index) => (
                <View key={session.id}>
                  {renderSessionItem({ item: session })}
                  {index < sessions.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <PTPText variant="body" color="gray500" center>
                No sessions yet
              </PTPText>
            </View>
          )}
        </View>

        {/* Contact Button */}
        <View style={styles.actions}>
          <PTPButton
            title="Message Parent"
            onPress={handleMessageParent}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.blackCard,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray700,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 0,
    backgroundColor: colors.inkBlack,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.blackCard,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray700,
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
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  emptyCard: {
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    padding: spacing[6],
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  notesRow: {
    paddingTop: spacing[3],
    marginTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
  },
  notesText: {
    marginTop: spacing[1],
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  sessionDate: {
    flex: 1,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    marginRight: spacing[1],
  },
  statusText: {
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray700,
  },
  actions: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
});

export default StudentDetailScreen;
