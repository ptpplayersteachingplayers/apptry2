import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

export default function ProfileScreen() {
  const { user, profile, signOut, refreshProfile, isStaff, staffMember } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim() || null,
          phone: formData.phone.trim() || null,
        })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        {isStaff && (
          <View style={styles.staffBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={styles.staffBadgeText}>
              {staffMember?.role === 'admin' ? 'Admin' : 'Staff'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              placeholder="Your full name"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  setFormData({
                    full_name: profile?.full_name || '',
                    phone: profile?.phone || '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {profile?.full_name || 'Not set'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#6b7280" />
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>
                {profile?.phone || 'Not set'}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.menuItemTextDanger}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>PTP Camp v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a365d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  staffBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  editButton: {
    fontSize: 14,
    color: '#1a365d',
    fontWeight: '500',
  },
  infoList: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  form: {},
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemTextDanger: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 12,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginVertical: 24,
  },
});
