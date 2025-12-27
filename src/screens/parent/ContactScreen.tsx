/**
 * Contact Screen (Parent)
 *
 * Contact and support page with:
 * - Hero CTA section
 * - FAQ accordion (expandable questions)
 * - Contact form: First/Last Name, Email, Phone, Message
 * - Quick contact links
 * - Direct contact options: Email, Phone, Text
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FAQItem, ContactFormData } from '../../types';
import { getFAQ, submitContactForm } from '../../api/content';
import {
  PTPText,
  PTPButton,
  PTPHero,
  AnimatedPressable,
  FadeInView,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { featureImages } from '../../assets/media';
import { useHaptics } from '../../hooks';

const CONTACT_INFO = {
  email: 'info@ptpsummercamps.com',
  phone: '(610) 555-0123',
  sms: '+16105550123',
};

/**
 * ContactScreen - Contact and support page
 */
const ContactScreen: React.FC = () => {
  const { selection, success } = useHaptics();

  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<ContactFormData>>({});

  useEffect(() => {
    loadFAQ();
  }, []);

  const loadFAQ = async () => {
    try {
      const faqData = await getFAQ();
      setFaqs(faqData);
    } catch (err) {
      console.error('Error loading FAQ:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFaq = (id: string) => {
    selection();
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const updateFormField = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<ContactFormData> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    selection();
    setIsSubmitting(true);

    try {
      const result = await submitContactForm(formData);
      if (result.success) {
        success();
        Alert.alert('Message Sent!', result.message);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: '',
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCall = () => {
    selection();
    Linking.openURL(`tel:${CONTACT_INFO.phone}`);
  };

  const handleEmail = () => {
    selection();
    Linking.openURL(`mailto:${CONTACT_INFO.email}`);
  };

  const handleText = () => {
    selection();
    const smsUrl = Platform.OS === 'ios'
      ? `sms:${CONTACT_INFO.sms}`
      : `sms:${CONTACT_INFO.sms}?body=Hi PTP! `;
    Linking.openURL(smsUrl);
  };

  const renderFaqItem = (faq: FAQItem) => {
    const isExpanded = expandedFaq === faq.id;

    return (
      <View key={faq.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() => toggleFaq(faq.id)}
          activeOpacity={0.7}
        >
          <PTPText variant="body" style={styles.faqQuestion}>
            {faq.question}
          </PTPText>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.gray400}
          />
        </TouchableOpacity>
        {isExpanded && (
          <FadeInView>
            <View style={styles.faqAnswer}>
              <PTPText variant="body" color="gray400">
                {faq.answer}
              </PTPText>
            </View>
          </FadeInView>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <PTPHero
          imageUrl={featureImages.contactHero || featureImages.homeHero}
          height={220}
        >
          <View style={styles.heroContent}>
            <PTPText variant="heroTitle" color="white">
              GET IN TOUCH
            </PTPText>
            <PTPText variant="heroSubtitle" color="gray300">
              We're here to help with any questions
            </PTPText>
          </View>
        </PTPHero>

        {/* Quick Contact Buttons */}
        <View style={styles.quickContactSection}>
          <View style={styles.quickContactButtons}>
            <TouchableOpacity style={styles.quickContactButton} onPress={handleCall}>
              <View style={styles.quickContactIcon}>
                <Ionicons name="call" size={24} color={colors.black} />
              </View>
              <PTPText variant="label">CALL</PTPText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickContactButton} onPress={handleText}>
              <View style={styles.quickContactIcon}>
                <Ionicons name="chatbubble" size={24} color={colors.black} />
              </View>
              <PTPText variant="label">TEXT</PTPText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickContactButton} onPress={handleEmail}>
              <View style={styles.quickContactIcon}>
                <Ionicons name="mail" size={24} color={colors.black} />
              </View>
              <PTPText variant="label">EMAIL</PTPText>
            </TouchableOpacity>
          </View>

          <View style={styles.contactInfo}>
            <TouchableOpacity onPress={handleEmail}>
              <PTPText variant="body" color="primary">
                {CONTACT_INFO.email}
              </PTPText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCall}>
              <PTPText variant="body" color="gray400">
                {CONTACT_INFO.phone}
              </PTPText>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={20} color={colors.primary} />
            <PTPText variant="sectionTitle">FREQUENTLY ASKED QUESTIONS</PTPText>
          </View>

          <View style={styles.faqList}>
            {faqs.map(renderFaqItem)}
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-open" size={20} color={colors.primary} />
            <PTPText variant="sectionTitle">SEND US A MESSAGE</PTPText>
          </View>

          <View style={styles.form}>
            {/* Name Row */}
            <View style={styles.formRow}>
              <View style={styles.formFieldHalf}>
                <PTPText variant="label" color="gray400" style={styles.fieldLabel}>
                  First Name *
                </PTPText>
                <TextInput
                  style={[styles.input, formErrors.firstName && styles.inputError]}
                  value={formData.firstName}
                  onChangeText={(v) => updateFormField('firstName', v)}
                  placeholder="First name"
                  placeholderTextColor={colors.gray600}
                  autoCapitalize="words"
                />
                {formErrors.firstName && (
                  <PTPText variant="caption" color="error" style={styles.errorText}>
                    {formErrors.firstName}
                  </PTPText>
                )}
              </View>

              <View style={styles.formFieldHalf}>
                <PTPText variant="label" color="gray400" style={styles.fieldLabel}>
                  Last Name *
                </PTPText>
                <TextInput
                  style={[styles.input, formErrors.lastName && styles.inputError]}
                  value={formData.lastName}
                  onChangeText={(v) => updateFormField('lastName', v)}
                  placeholder="Last name"
                  placeholderTextColor={colors.gray600}
                  autoCapitalize="words"
                />
                {formErrors.lastName && (
                  <PTPText variant="caption" color="error" style={styles.errorText}>
                    {formErrors.lastName}
                  </PTPText>
                )}
              </View>
            </View>

            {/* Email */}
            <View style={styles.formField}>
              <PTPText variant="label" color="gray400" style={styles.fieldLabel}>
                Email *
              </PTPText>
              <TextInput
                style={[styles.input, formErrors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(v) => updateFormField('email', v)}
                placeholder="your@email.com"
                placeholderTextColor={colors.gray600}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {formErrors.email && (
                <PTPText variant="caption" color="error" style={styles.errorText}>
                  {formErrors.email}
                </PTPText>
              )}
            </View>

            {/* Phone */}
            <View style={styles.formField}>
              <PTPText variant="label" color="gray400" style={styles.fieldLabel}>
                Phone (Optional)
              </PTPText>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(v) => updateFormField('phone', v)}
                placeholder="(555) 555-5555"
                placeholderTextColor={colors.gray600}
                keyboardType="phone-pad"
              />
            </View>

            {/* Message */}
            <View style={styles.formField}>
              <PTPText variant="label" color="gray400" style={styles.fieldLabel}>
                Message *
              </PTPText>
              <TextInput
                style={[styles.textArea, formErrors.message && styles.inputError]}
                value={formData.message}
                onChangeText={(v) => updateFormField('message', v)}
                placeholder="How can we help?"
                placeholderTextColor={colors.gray600}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {formErrors.message && (
                <PTPText variant="caption" color="error" style={styles.errorText}>
                  {formErrors.message}
                </PTPText>
              )}
            </View>

            {/* Submit Button */}
            <PTPButton
              title={isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
              variant="primary"
              size="large"
              fullWidth
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        </View>

        {/* Locations */}
        <View style={styles.locationsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <PTPText variant="sectionTitle">WHERE WE TRAIN</PTPText>
          </View>

          <View style={styles.locationsList}>
            {['Pennsylvania', 'New Jersey', 'Delaware', 'Maryland', 'New York'].map((state) => (
              <View key={state} style={styles.locationItem}>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
                <PTPText variant="body" color="gray400">{state}</PTPText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  heroContent: {
    alignItems: 'center',
    paddingTop: spacing[6],
  },
  quickContactSection: {
    padding: spacing[4],
    alignItems: 'center',
  },
  quickContactButtons: {
    flexDirection: 'row',
    gap: spacing[6],
    marginBottom: spacing[4],
  },
  quickContactButton: {
    alignItems: 'center',
    gap: spacing[2],
  },
  quickContactIcon: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    alignItems: 'center',
    gap: spacing[1],
  },
  faqSection: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  faqList: {
    gap: spacing[2],
  },
  faqItem: {
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  faqQuestion: {
    flex: 1,
    marginRight: spacing[2],
  },
  faqAnswer: {
    padding: spacing[4],
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
  },
  formSection: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
  },
  form: {
    gap: spacing[4],
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  formField: {
    gap: spacing[1],
  },
  formFieldHalf: {
    flex: 1,
    gap: spacing[1],
  },
  fieldLabel: {
    marginBottom: spacing[1],
  },
  input: {
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    color: colors.white,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    color: colors.white,
    fontSize: 16,
    minHeight: 120,
  },
  errorText: {
    marginTop: spacing[1],
  },
  submitButton: {
    marginTop: spacing[2],
  },
  locationsSection: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
  },
  locationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    width: '45%',
  },
});

export default ContactScreen;
