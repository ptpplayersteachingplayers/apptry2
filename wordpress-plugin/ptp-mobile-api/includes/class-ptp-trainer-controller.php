<?php
/**
 * Trainer Controller
 *
 * Handles trainer-specific endpoints for the PTP Mobile API.
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PTP_Trainer_Controller class
 */
class PTP_Trainer_Controller {

    /**
     * REST namespace
     */
    private $namespace = 'ptp/v1';

    /**
     * Register routes
     */
    public function register_routes() {
        // Get trainer dashboard stats
        register_rest_route($this->namespace, '/trainer/dashboard', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_dashboard'),
            'permission_callback' => array($this, 'check_trainer_auth'),
        ));

        // Get trainer's sessions
        register_rest_route($this->namespace, '/trainer/sessions', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_sessions'),
            'permission_callback' => array($this, 'check_trainer_auth'),
            'args' => array(
                'status' => array(
                    'type' => 'string',
                    'enum' => array('all', 'requested', 'confirmed', 'completed', 'cancelled'),
                    'default' => 'all',
                ),
                'date' => array(
                    'type' => 'string',
                    'format' => 'date',
                ),
            ),
        ));

        // Accept/decline session request
        register_rest_route($this->namespace, '/trainer/sessions/(?P<id>\d+)/respond', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'respond_to_request'),
            'permission_callback' => array($this, 'check_trainer_auth'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
                'action' => array(
                    'required' => true,
                    'type' => 'string',
                    'enum' => array('accept', 'decline'),
                ),
                'message' => array(
                    'type' => 'string',
                ),
            ),
        ));

        // Complete session
        register_rest_route($this->namespace, '/trainer/sessions/(?P<id>\d+)/complete', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'complete_session'),
            'permission_callback' => array($this, 'check_trainer_auth'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
                'notes' => array(
                    'type' => 'string',
                ),
            ),
        ));

        // Update trainer profile
        register_rest_route($this->namespace, '/trainer/profile', array(
            'methods' => WP_REST_Server::EDITABLE,
            'callback' => array($this, 'update_profile'),
            'permission_callback' => array($this, 'check_trainer_auth'),
        ));

        // Update trainer availability
        register_rest_route($this->namespace, '/trainer/availability', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_availability'),
                'permission_callback' => array($this, 'check_trainer_auth'),
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_availability'),
                'permission_callback' => array($this, 'check_trainer_auth'),
            ),
        ));

        // Get trainer's students
        register_rest_route($this->namespace, '/trainer/students', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_students'),
            'permission_callback' => array($this, 'check_trainer_auth'),
        ));

        // Get single student
        register_rest_route($this->namespace, '/trainer/students/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_student'),
            'permission_callback' => array($this, 'check_trainer_auth'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
            ),
        ));

        // Get trainer earnings
        register_rest_route($this->namespace, '/trainer/earnings', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_earnings'),
            'permission_callback' => array($this, 'check_trainer_auth'),
            'args' => array(
                'period' => array(
                    'type' => 'string',
                    'enum' => array('week', 'month', 'year', 'all'),
                    'default' => 'month',
                ),
            ),
        ));
    }

    /**
     * Check trainer authentication
     */
    public function check_trainer_auth($request) {
        $user = wp_get_current_user();
        return $user->ID !== 0 && in_array('ptp_trainer', $user->roles);
    }

    /**
     * Get dashboard data
     */
    public function get_dashboard($request) {
        global $wpdb;
        $user = wp_get_current_user();

        $table_name = $wpdb->prefix . 'ptp_training_sessions';
        $today = date('Y-m-d');

        // Today's sessions
        $todays_sessions = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_name
                 WHERE trainer_id = %d
                 AND session_date = %s
                 AND status = 'confirmed'
                 ORDER BY start_time ASC",
                $user->ID,
                $today
            ),
            ARRAY_A
        );

        // Pending requests
        $pending_count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name
                 WHERE trainer_id = %d
                 AND status = 'requested'",
                $user->ID
            )
        );

        // This week's sessions count
        $week_start = date('Y-m-d', strtotime('monday this week'));
        $week_end = date('Y-m-d', strtotime('sunday this week'));
        $weekly_sessions = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name
                 WHERE trainer_id = %d
                 AND session_date BETWEEN %s AND %s
                 AND status IN ('confirmed', 'completed')",
                $user->ID,
                $week_start,
                $week_end
            )
        );

        // This month's earnings
        $month_start = date('Y-m-01');
        $month_end = date('Y-m-t');
        $monthly_earnings = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COALESCE(SUM(price), 0) FROM $table_name
                 WHERE trainer_id = %d
                 AND session_date BETWEEN %s AND %s
                 AND status = 'completed'
                 AND is_paid = 1",
                $user->ID,
                $month_start,
                $month_end
            )
        );

        // Total students
        $total_students = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(DISTINCT parent_id) FROM $table_name
                 WHERE trainer_id = %d
                 AND status IN ('confirmed', 'completed')",
                $user->ID
            )
        );

        // Format today's sessions
        $formatted_sessions = array_map(function($session) {
            $parent = get_user_by('ID', $session['parent_id']);
            return array(
                'id' => (int) $session['id'],
                'time' => $session['start_time'] . ' - ' . $session['end_time'],
                'client' => $parent ? $parent->display_name : 'Unknown',
                'location' => $session['location'],
                'focus' => $session['focus'],
            );
        }, $todays_sessions);

        // Next session
        $next_session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name
                 WHERE trainer_id = %d
                 AND (session_date > %s OR (session_date = %s AND start_time > %s))
                 AND status = 'confirmed'
                 ORDER BY session_date ASC, start_time ASC
                 LIMIT 1",
                $user->ID,
                $today,
                $today,
                date('H:i:s')
            ),
            ARRAY_A
        );

        return rest_ensure_response(array(
            'todays_sessions' => $formatted_sessions,
            'pending_requests' => (int) $pending_count,
            'weekly_sessions' => (int) $weekly_sessions,
            'monthly_earnings' => (float) $monthly_earnings,
            'total_students' => (int) $total_students,
            'next_session' => $next_session ? $this->format_session($next_session) : null,
            'rating' => (float) get_user_meta($user->ID, 'trainer_rating', true),
            'total_reviews' => (int) get_user_meta($user->ID, 'trainer_total_reviews', true),
        ));
    }

    /**
     * Get sessions
     */
    public function get_sessions($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $status = $request->get_param('status');
        $date = $request->get_param('date');

        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        $query = "SELECT * FROM $table_name WHERE trainer_id = %d";
        $params = array($user->ID);

        if ($status !== 'all') {
            $query .= " AND status = %s";
            $params[] = $status;
        }

        if ($date) {
            $query .= " AND session_date = %s";
            $params[] = $date;
        }

        $query .= " ORDER BY session_date ASC, start_time ASC";

        $sessions = $wpdb->get_results(
            $wpdb->prepare($query, $params),
            ARRAY_A
        );

        $data = array_map(array($this, 'format_session'), $sessions);

        return rest_ensure_response(array(
            'sessions' => $data,
        ));
    }

    /**
     * Respond to session request
     */
    public function respond_to_request($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $id = (int) $request->get_param('id');
        $action = $request->get_param('action');
        $message = sanitize_textarea_field($request->get_param('message'));

        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        // Verify session belongs to trainer
        $session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE id = %d AND trainer_id = %d AND status = 'requested'",
                $id,
                $user->ID
            ),
            ARRAY_A
        );

        if (!$session) {
            return new WP_Error(
                'session_not_found',
                'Session request not found',
                array('status' => 404)
            );
        }

        $new_status = ($action === 'accept') ? 'confirmed' : 'declined';

        $wpdb->update(
            $table_name,
            array(
                'status' => $new_status,
                'trainer_notes' => $message,
            ),
            array('id' => $id),
            array('%s', '%s'),
            array('%d')
        );

        // Notify parent
        $push_token = get_user_meta($session['parent_id'], 'push_token', true);
        if ($push_token) {
            $trainer_name = $user->display_name;
            $notification_body = ($action === 'accept')
                ? "$trainer_name has accepted your training request!"
                : "$trainer_name has declined your training request.";

            do_action('ptp_send_push_notification', $push_token, array(
                'title' => 'Session Request ' . ucfirst($new_status),
                'body' => $notification_body,
                'data' => array(
                    'type' => 'session_response',
                    'session_id' => $id,
                    'action' => $action,
                ),
            ));
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Session request ' . $new_status,
            'status' => $new_status,
        ));
    }

    /**
     * Complete session
     */
    public function complete_session($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $id = (int) $request->get_param('id');
        $notes = sanitize_textarea_field($request->get_param('notes'));

        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        // Verify session belongs to trainer
        $session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE id = %d AND trainer_id = %d AND status = 'confirmed'",
                $id,
                $user->ID
            ),
            ARRAY_A
        );

        if (!$session) {
            return new WP_Error(
                'session_not_found',
                'Session not found',
                array('status' => 404)
            );
        }

        $wpdb->update(
            $table_name,
            array(
                'status' => 'completed',
                'trainer_notes' => $notes,
            ),
            array('id' => $id),
            array('%s', '%s'),
            array('%d')
        );

        // Notify parent to leave review
        $push_token = get_user_meta($session['parent_id'], 'push_token', true);
        if ($push_token) {
            do_action('ptp_send_push_notification', $push_token, array(
                'title' => 'Session Completed',
                'body' => 'Your training session has been completed. Leave a review!',
                'data' => array(
                    'type' => 'session_completed',
                    'session_id' => $id,
                ),
            ));
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Session marked as completed',
        ));
    }

    /**
     * Update trainer profile
     */
    public function update_profile($request) {
        $user = wp_get_current_user();
        $params = $request->get_json_params();

        // Update basic user info
        $update_data = array('ID' => $user->ID);

        if (isset($params['first_name'])) {
            $update_data['first_name'] = sanitize_text_field($params['first_name']);
        }
        if (isset($params['last_name'])) {
            $update_data['last_name'] = sanitize_text_field($params['last_name']);
        }
        if (isset($params['first_name']) || isset($params['last_name'])) {
            $first = isset($params['first_name']) ? $params['first_name'] : $user->first_name;
            $last = isset($params['last_name']) ? $params['last_name'] : $user->last_name;
            $update_data['display_name'] = $first . ' ' . $last;
        }

        if (count($update_data) > 1) {
            wp_update_user($update_data);
        }

        // Update trainer-specific meta
        $trainer_fields = array(
            'phone' => 'phone',
            'location' => 'location',
            'avatar_url' => 'avatar_url',
            'bio' => 'trainer_bio',
            'hourly_rate' => 'trainer_hourly_rate',
            'specializations' => 'trainer_specializations',
            'certifications' => 'trainer_certifications',
            'experience_years' => 'trainer_experience_years',
            'education' => 'trainer_education',
            'gallery' => 'trainer_gallery',
        );

        foreach ($trainer_fields as $param_key => $meta_key) {
            if (isset($params[$param_key])) {
                $value = $params[$param_key];
                if (is_string($value)) {
                    $value = sanitize_text_field($value);
                }
                update_user_meta($user->ID, $meta_key, $value);
            }
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Profile updated',
        ));
    }

    /**
     * Get availability
     */
    public function get_availability($request) {
        $user = wp_get_current_user();

        $working_hours = get_user_meta($user->ID, 'trainer_working_hours', true) ?: array(
            'monday' => array('start' => '09:00', 'end' => '18:00', 'available' => true),
            'tuesday' => array('start' => '09:00', 'end' => '18:00', 'available' => true),
            'wednesday' => array('start' => '09:00', 'end' => '18:00', 'available' => true),
            'thursday' => array('start' => '09:00', 'end' => '18:00', 'available' => true),
            'friday' => array('start' => '09:00', 'end' => '18:00', 'available' => true),
            'saturday' => array('start' => '09:00', 'end' => '14:00', 'available' => true),
            'sunday' => array('start' => null, 'end' => null, 'available' => false),
        );

        $blocked_dates = get_user_meta($user->ID, 'trainer_blocked_dates', true) ?: array();

        return rest_ensure_response(array(
            'working_hours' => $working_hours,
            'blocked_dates' => $blocked_dates,
        ));
    }

    /**
     * Update availability
     */
    public function update_availability($request) {
        $user = wp_get_current_user();
        $params = $request->get_json_params();

        if (isset($params['working_hours'])) {
            $sanitized_hours = $this->sanitize_working_hours($params['working_hours']);
            if (is_wp_error($sanitized_hours)) {
                return $sanitized_hours;
            }
            update_user_meta($user->ID, 'trainer_working_hours', $sanitized_hours);
        }

        if (isset($params['blocked_dates'])) {
            $sanitized_dates = $this->sanitize_blocked_dates($params['blocked_dates']);
            if (is_wp_error($sanitized_dates)) {
                return $sanitized_dates;
            }
            update_user_meta($user->ID, 'trainer_blocked_dates', $sanitized_dates);
        }

        ptp_log_activity($user->ID, 'availability_updated', array(
            'has_working_hours' => isset($params['working_hours']),
            'has_blocked_dates' => isset($params['blocked_dates']),
        ));

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Availability updated',
        ));
    }

    /**
     * Sanitize and validate working hours input
     */
    private function sanitize_working_hours($working_hours) {
        if (!is_array($working_hours)) {
            return new WP_Error(
                'invalid_format',
                'Working hours must be an array',
                array('status' => 400)
            );
        }

        $valid_days = array('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
        $sanitized = array();

        foreach ($valid_days as $day) {
            if (isset($working_hours[$day]) && is_array($working_hours[$day])) {
                $day_data = $working_hours[$day];

                // Validate time format (HH:MM)
                $start = isset($day_data['start']) ? sanitize_text_field($day_data['start']) : null;
                $end = isset($day_data['end']) ? sanitize_text_field($day_data['end']) : null;
                $available = isset($day_data['available']) ? (bool) $day_data['available'] : false;

                // Validate time format if provided
                if ($start && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $start)) {
                    return new WP_Error(
                        'invalid_time',
                        "Invalid start time format for $day",
                        array('status' => 400)
                    );
                }

                if ($end && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $end)) {
                    return new WP_Error(
                        'invalid_time',
                        "Invalid end time format for $day",
                        array('status' => 400)
                    );
                }

                $sanitized[$day] = array(
                    'start' => $start,
                    'end' => $end,
                    'available' => $available,
                );
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize and validate blocked dates input
     */
    private function sanitize_blocked_dates($blocked_dates) {
        if (!is_array($blocked_dates)) {
            return new WP_Error(
                'invalid_format',
                'Blocked dates must be an array',
                array('status' => 400)
            );
        }

        // Limit to 365 blocked dates to prevent abuse
        if (count($blocked_dates) > 365) {
            return new WP_Error(
                'too_many_dates',
                'Maximum 365 blocked dates allowed',
                array('status' => 400)
            );
        }

        $sanitized = array();
        foreach ($blocked_dates as $date) {
            $date = sanitize_text_field($date);
            // Validate date format (YYYY-MM-DD)
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                // Verify it's a valid date
                $parts = explode('-', $date);
                if (checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0])) {
                    $sanitized[] = $date;
                }
            }
        }

        return array_unique($sanitized);
    }

    /**
     * Get students
     */
    public function get_students($request) {
        global $wpdb;
        $user = wp_get_current_user();

        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        // Get unique parents who have had sessions
        $parent_ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT DISTINCT parent_id FROM $table_name
                 WHERE trainer_id = %d
                 AND status IN ('confirmed', 'completed')",
                $user->ID
            )
        );

        $students = array();
        foreach ($parent_ids as $parent_id) {
            $parent = get_user_by('ID', $parent_id);
            if (!$parent) continue;

            // Get session stats
            $total_sessions = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM $table_name
                     WHERE trainer_id = %d AND parent_id = %d
                     AND status IN ('confirmed', 'completed')",
                    $user->ID,
                    $parent_id
                )
            );

            $last_session = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT MAX(session_date) FROM $table_name
                     WHERE trainer_id = %d AND parent_id = %d
                     AND status = 'completed'",
                    $user->ID,
                    $parent_id
                )
            );

            // Get children
            $children = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT c.* FROM {$wpdb->prefix}ptp_children c
                     INNER JOIN $table_name s ON c.id = s.child_id
                     WHERE s.trainer_id = %d AND s.parent_id = %d
                     GROUP BY c.id",
                    $user->ID,
                    $parent_id
                ),
                ARRAY_A
            );

            $students[] = array(
                'id' => $parent_id,
                'name' => $parent->display_name,
                'email' => $parent->user_email,
                'phone' => get_user_meta($parent_id, 'phone', true),
                'avatar_url' => get_user_meta($parent_id, 'avatar_url', true) ?: get_avatar_url($parent_id),
                'total_sessions' => (int) $total_sessions,
                'last_session' => $last_session,
                'children' => array_map(function($child) {
                    return array(
                        'id' => (int) $child['id'],
                        'name' => $child['first_name'] . ' ' . $child['last_name'],
                        'age_band' => $child['age_band'],
                        'skill_level' => $child['skill_level'],
                    );
                }, $children ?: array()),
            );
        }

        // Sort by total sessions
        usort($students, function($a, $b) {
            return $b['total_sessions'] - $a['total_sessions'];
        });

        return rest_ensure_response(array(
            'students' => $students,
        ));
    }

    /**
     * Get single student
     */
    public function get_student($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $parent_id = (int) $request->get_param('id');

        // Verify this parent has had sessions with trainer
        $table_name = $wpdb->prefix . 'ptp_training_sessions';
        $has_sessions = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name
                 WHERE trainer_id = %d AND parent_id = %d",
                $user->ID,
                $parent_id
            )
        );

        if (!$has_sessions) {
            return new WP_Error(
                'student_not_found',
                'Student not found',
                array('status' => 404)
            );
        }

        $parent = get_user_by('ID', $parent_id);
        if (!$parent) {
            return new WP_Error(
                'student_not_found',
                'Student not found',
                array('status' => 404)
            );
        }

        // Get session history
        $sessions = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_name
                 WHERE trainer_id = %d AND parent_id = %d
                 ORDER BY session_date DESC, start_time DESC
                 LIMIT 20",
                $user->ID,
                $parent_id
            ),
            ARRAY_A
        );

        // Get children
        $children = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}ptp_children WHERE parent_id = %d",
                $parent_id
            ),
            ARRAY_A
        );

        return rest_ensure_response(array(
            'student' => array(
                'id' => $parent_id,
                'name' => $parent->display_name,
                'email' => $parent->user_email,
                'phone' => get_user_meta($parent_id, 'phone', true),
                'avatar_url' => get_user_meta($parent_id, 'avatar_url', true) ?: get_avatar_url($parent_id),
                'location' => get_user_meta($parent_id, 'location', true),
                'children' => array_map(function($child) {
                    return array(
                        'id' => (int) $child['id'],
                        'first_name' => $child['first_name'],
                        'last_name' => $child['last_name'],
                        'age_band' => $child['age_band'],
                        'skill_level' => $child['skill_level'],
                        'position' => $child['position'],
                        'team' => $child['team'],
                        'notes' => $child['notes'],
                    );
                }, $children ?: array()),
                'sessions' => array_map(array($this, 'format_session'), $sessions),
            ),
        ));
    }

    /**
     * Get earnings
     */
    public function get_earnings($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $period = $request->get_param('period');

        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        // Determine date range
        switch ($period) {
            case 'week':
                $start_date = date('Y-m-d', strtotime('monday this week'));
                $end_date = date('Y-m-d', strtotime('sunday this week'));
                break;
            case 'month':
                $start_date = date('Y-m-01');
                $end_date = date('Y-m-t');
                break;
            case 'year':
                $start_date = date('Y-01-01');
                $end_date = date('Y-12-31');
                break;
            default:
                $start_date = '2000-01-01';
                $end_date = date('Y-m-d');
        }

        // Total earnings
        $total_earnings = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COALESCE(SUM(price), 0) FROM $table_name
                 WHERE trainer_id = %d
                 AND session_date BETWEEN %s AND %s
                 AND status = 'completed'",
                $user->ID,
                $start_date,
                $end_date
            )
        );

        // Paid earnings
        $paid_earnings = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COALESCE(SUM(price), 0) FROM $table_name
                 WHERE trainer_id = %d
                 AND session_date BETWEEN %s AND %s
                 AND status = 'completed'
                 AND is_paid = 1",
                $user->ID,
                $start_date,
                $end_date
            )
        );

        // Pending earnings
        $pending_earnings = $total_earnings - $paid_earnings;

        // Session count
        $session_count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name
                 WHERE trainer_id = %d
                 AND session_date BETWEEN %s AND %s
                 AND status = 'completed'",
                $user->ID,
                $start_date,
                $end_date
            )
        );

        // Earnings by date
        $earnings_by_date = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT session_date as date, SUM(price) as amount, COUNT(*) as sessions
                 FROM $table_name
                 WHERE trainer_id = %d
                 AND session_date BETWEEN %s AND %s
                 AND status = 'completed'
                 GROUP BY session_date
                 ORDER BY session_date ASC",
                $user->ID,
                $start_date,
                $end_date
            ),
            ARRAY_A
        );

        return rest_ensure_response(array(
            'period' => $period,
            'start_date' => $start_date,
            'end_date' => $end_date,
            'total_earnings' => (float) $total_earnings,
            'paid_earnings' => (float) $paid_earnings,
            'pending_earnings' => (float) $pending_earnings,
            'session_count' => (int) $session_count,
            'earnings_by_date' => array_map(function($item) {
                return array(
                    'date' => $item['date'],
                    'amount' => (float) $item['amount'],
                    'sessions' => (int) $item['sessions'],
                );
            }, $earnings_by_date ?: array()),
        ));
    }

    /**
     * Format session for API response
     */
    private function format_session($session) {
        $parent = get_user_by('ID', $session['parent_id']);

        // Get child info
        $child = null;
        if ($session['child_id']) {
            global $wpdb;
            $child = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM {$wpdb->prefix}ptp_children WHERE id = %d",
                    $session['child_id']
                ),
                ARRAY_A
            );
        }

        return array(
            'id' => (int) $session['id'],
            'parent' => $parent ? array(
                'id' => $parent->ID,
                'name' => $parent->display_name,
                'avatar_url' => get_user_meta($parent->ID, 'avatar_url', true) ?: get_avatar_url($parent->ID),
                'phone' => get_user_meta($parent->ID, 'phone', true),
            ) : null,
            'child' => $child ? array(
                'id' => (int) $child['id'],
                'name' => $child['first_name'] . ' ' . $child['last_name'],
                'age_band' => $child['age_band'],
                'skill_level' => $child['skill_level'],
            ) : null,
            'date' => $session['session_date'],
            'start_time' => $session['start_time'],
            'end_time' => $session['end_time'],
            'location' => $session['location'],
            'focus' => $session['focus'],
            'player_notes' => $session['player_notes'],
            'trainer_notes' => $session['trainer_notes'],
            'status' => $session['status'],
            'price' => (float) $session['price'],
            'is_paid' => (bool) $session['is_paid'],
            'created_at' => $session['created_at'],
        );
    }
}
