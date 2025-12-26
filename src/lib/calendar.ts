/**
 * Calendar Utilities
 * 
 * Provides functionality to add events to the device calendar.
 * Uses expo-calendar for native calendar integration.
 */

import * as Calendar from 'expo-calendar';
import { Platform, Alert, Linking } from 'react-native';

export interface CalendarEvent {
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
    timeZone?: string;
}

/**
 * Request calendar permissions
 */
export const requestCalendarPermissions = async (): Promise<boolean> => {
    try {
          const { status } = await Calendar.requestCalendarPermissionsAsync();
          return status === 'granted';
    } catch (error) {
          console.error('Error requesting calendar permissions:', error);
          return false;
    }
};

/**
 * Get the default calendar ID for the platform
 */
const getDefaultCalendarId = async (): Promise<string | null> => {
    try {
          const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      // For iOS, find the default calendar or the first iCloud calendar
      if (Platform.OS === 'ios') {
              const defaultCalendar = calendars.find(
                        (cal) => cal.allowsModifications && cal.source?.name === 'iCloud'
                      ) || calendars.find((cal) => cal.allowsModifications);

            return defaultCalendar?.id || null;
      }

      // For Android, find the primary calendar or the first one that allows modifications
      const primaryCalendar = calendars.find(
              (cal) => cal.isPrimary && cal.allowsModifications
            ) || calendars.find((cal) => cal.allowsModifications);

      return primaryCalendar?.id || null;
    } catch (error) {
          console.error('Error getting calendars:', error);
          return null;
    }
};

/**
 * Add an event to the device calendar
 */
export const addEventToCalendar = async (event: CalendarEvent): Promise<boolean> => {
    try {
          // Request permissions first
      const hasPermission = await requestCalendarPermissions();

      if (!hasPermission) {
              Alert.alert(
                        'Calendar Permission Required',
                        'Please allow calendar access to add this event to your calendar.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                                      text: 'Open Settings', 
                                        onPress: () => Linking.openSettings() 
                          },
                                  ]
                      );
              return false;
      }

      // Get the default calendar
      const calendarId = await getDefaultCalendarId();

      if (!calendarId) {
              Alert.alert(
                        'No Calendar Found',
                        'Unable to find a calendar to add the event to. Please make sure you have a calendar set up on your device.'
                      );
              return false;
      }

      // Create the event
      await Calendar.createEventAsync(calendarId, {
              title: event.title,
              startDate: event.startDate,
              endDate: event.endDate,
              location: event.location,
              notes: event.notes,
              timeZone: event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              alarms: [
                { relativeOffset: -60 }, // 1 hour before
                { relativeOffset: -1440 }, // 1 day before
                      ],
      });

      Alert.alert(
              'Added to Calendar',
              `"${event.title}" has been added to your calendar.`,
              [{ text: 'OK' }]
            );

      return true;
    } catch (error) {
          console.error('Error adding event to calendar:', error);
          Alert.alert(
                  'Error',
                  'Unable to add the event to your calendar. Please try again.'
                );
          return false;
    }
};

/**
 * Create a calendar event from program details
 */
export const createProgramCalendarEvent = (
    programName: string,
    programDate: string,
    programTime?: string,
    programLocation?: string,
    durationHours: number = 2
  ): CalendarEvent => {
      // Parse the date string (expected format: YYYY-MM-DD)
    const [year, month, day] = programDate.split('-').map(Number);

    // Parse time if provided (expected format: HH:MM or H:MM AM/PM)
    let hours = 9; // Default to 9 AM
    let minutes = 0;

    if (programTime) {
          const timeMatch = programTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
          if (timeMatch) {
                  hours = parseInt(timeMatch[1], 10);
                  minutes = parseInt(timeMatch[2] || '0', 10);

            // Handle AM/PM
            if (timeMatch[3]) {
                      const isPM = timeMatch[3].toUpperCase() === 'PM';
                      if (isPM && hours !== 12) hours += 12;
                      if (!isPM && hours === 12) hours = 0;
            }
          }
    }

    const startDate = new Date(year, month - 1, day, hours, minutes);
      const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

    return {
          title: programName,
          startDate,
          endDate,
          location: programLocation,
          notes: `PTP Soccer - ${programName}\n\nRemember to bring:\n- Water bottle\n- Cleats\n- Shin guards`,
    };
  };

/**
 * Quick function to add a program to calendar
 */
export const addProgramToCalendar = async (
    programName: string,
    programDate: string,
    programTime?: string,
    programLocation?: string
  ): Promise<boolean> => {
    const event = createProgramCalendarEvent(
          programName,
          programDate,
          programTime,
          programLocation
        );

    return addEventToCalendar(event);
};
