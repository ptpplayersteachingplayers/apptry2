/**
 * Trainer Students Screen
 *
 * List of students the trainer has worked with.
 */

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PTPText, PTPSearchInput, PTPTag, PTPEmptyState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

// Mock student data
const mockStudents = [
  { id: 1, firstName: 'Jake', age: 10, skillLevel: 'travel', sessionsCount: 5, lastSession: '2024-11-28' },
  { id: 2, firstName: 'Sophia', age: 13, skillLevel: 'elite', sessionsCount: 3, lastSession: '2024-11-25' },
  { id: 3, firstName: 'Lucas', age: 8, skillLevel: 'rec', sessionsCount: 2, lastSession: '2024-11-20' },
];

const TrainerStudentsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const students = mockStudents;

  const filteredStudents = students.filter(s =>
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderStudent = ({ item }: { item: typeof mockStudents[0] }) => (
    <TouchableOpacity style={styles.studentCard}>
      <View style={styles.avatar}>
        <PTPText color="white" weight="semiBold">{item.firstName[0]}</PTPText>
      </View>
      <View style={styles.studentInfo}>
        <PTPText variant="buttonMedium">{item.firstName}</PTPText>
        <PTPText variant="bodySmall" color="gray500">Age {item.age} • {item.skillLevel}</PTPText>
      </View>
      <View style={styles.studentStats}>
        <PTPText variant="label">{item.sessionsCount} sessions</PTPText>
        <PTPText variant="caption" color="gray400">Last: {formatDate(item.lastSession)}</PTPText>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <PTPText variant="heroTitle">My Students</PTPText>
        <PTPText variant="body" color="gray500">{students.length} players trained</PTPText>
      </View>

      <View style={styles.searchContainer}>
        <PTPSearchInput
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStudent}
        ListEmptyComponent={<PTPEmptyState iconName="people-outline" title="No students yet" description="Students you train will appear here." />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { padding: spacing[4] },
  searchContainer: { paddingHorizontal: spacing[4], marginBottom: spacing[3] },
  listContent: { padding: spacing[4], paddingTop: 0, flexGrow: 1 },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blackCard, borderRadius: 0, padding: spacing[4], marginBottom: spacing[3], borderWidth: 2, borderColor: colors.gray700 },
  avatar: { width: 48, height: 48, borderRadius: 0, backgroundColor: colors.inkBlack, justifyContent: 'center', alignItems: 'center', marginRight: spacing[3] },
  studentInfo: { flex: 1 },
  studentStats: { alignItems: 'flex-end' },
});

export default TrainerStudentsScreen;
