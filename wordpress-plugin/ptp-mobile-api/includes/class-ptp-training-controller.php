<?php
/**
 * Training Controller
 *
 * Handles private training and mentorship endpoints for the PTP Mobile API.
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PTP_Training_Controller class
 */
class PTP_Training_Controller {

    /**
     * REST namespace
     */
    private $namespace = 'ptp/v2';

    /**
     * Register routes
     */
    public function register_routes() {
        // Get all trainers
        register_rest_route($this->namespace, '/trainers', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_trainers'),
            'permission_callback' => '__return_true',
            'args' => array(
                'location' => array(
                    'type' => 'string',
                ),
                'specialization' => array(
                    'type' => 'string',
                ),
                'min_rating' => array(
                    'type' => 'number',
                ),
                'max_price' => array(
                    'type' => 'number',
                ),
                'search' => array(
                    'type' => 'string',
                ),
                'page' => array(
                    'type' => 'integer',
                    'default' => 1,
                ),
                'per_page' => array(
                    'type' => 'integer',
                    'default' => 20,
                ),
            ),
        ));

        // Get single trainer
        register_rest_route($this->namespace, '/trainers/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_trainer'),
            'permission_callback' => '__return_true',
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
            ),
        ));

        // Get trainer availability
        register_rest_route($this->namespace, '/trainers/(?P<id>\d+)/availability', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_trainer_availability'),
            'permission_callback' => '__return_true',
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
                'date' => array(
                    'type' => 'string',
                    'format' => 'date',
                ),
            ),
        ));

        // Request a training session
        register_rest_route($this->namespace, '/training/request', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'request_session'),
            'permission_callback' => array($this, 'check_parent_auth'),
            'args' => array(
                'trainer_id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
                'child_id' => array(
                    'required' => false,
                    'type' => 'integer',
                ),
                'date' => array(
                    'required' => true,
                    'type' => 'string',
                    'format' => 'date',
                ),
                'start_time' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'duration' => array(
                    'required' => true,
                    'type' => 'integer',
                    'enum' => array(30, 60, 90, 120),
                ),
                'location' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'focus' => array(
                    'type' => 'string',
                ),
                'notes' => array(
                    'type' => 'string',
                ),
            ),
        ));

        // Get my training sessions (parent)
        register_rest_route($this->namespace, '/training/my-sessions', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_my_sessions'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'status' => array(
                    'type' => 'string',
                    'enum' => array('all', 'upcoming', 'past', 'pending'),
                    'default' => 'all',
                ),
            ),
        ));

        // Get single session
        register_rest_route($this->namespace, '/training/sessions/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_session'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
            ),
        ));

        // Cancel session
        register_rest_route($this->namespace, '/training/sessions/(?P<id>\d+)/cancel', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'cancel_session'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
                'reason' => array(
                    'type' => 'string',
                ),
            ),
        ));

        // Add/manage child profiles
        register_rest_route($this->namespace, '/children', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_children'),
                'permission_callback' => array($this, 'check_parent_auth'),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'add_child'),
                'permission_callback' => array($this, 'check_parent_auth'),
            ),
        ));

        // Update/delete child
        register_rest_route($this->namespace, '/children/(?P<id>\d+)', array(
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_child'),
                'permission_callback' => array($this, 'check_parent_auth'),
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_child'),
                'permission_callback' => array($this, 'check_parent_auth'),
            ),
        ));
    }

    /**
     * Check authentication
     */
    public function check_auth($request) {
        $user = wp_get_current_user();
        return $user->ID !== 0;
    }

    /**
     * Check parent authentication
     */
    public function check_parent_auth($request) {
        $user = wp_get_current_user();
        return $user->ID !== 0 && in_array('ptp_parent', $user->roles);
    }

    /**
     * Get trainers
     */
    public function get_trainers($request) {
        $location = $request->get_param('location');
        $specialization = $request->get_param('specialization');
        $min_rating = $request->get_param('min_rating');
        $max_price = $request->get_param('max_price');
        $search = $request->get_param('search');
        $page = (int) $request->get_param('page');
        $per_page = (int) $request->get_param('per_page');

        // Query trainers
        $args = array(
            'role' => 'ptp_trainer',
            'number' => $per_page,
            'offset' => ($page - 1) * $per_page,
            'meta_query' => array(
                array(
                    'key' => 'trainer_active',
                    'value' => '1',
                    'compare' => '=',
                ),
            ),
        );

        if ($search) {
            $args['search'] = '*' . $search . '*';
            $args['search_columns'] = array('display_name', 'user_email');
        }

        $user_query = new WP_User_Query($args);
        $trainers = $user_query->get_results();

        // Filter by additional criteria
        $filtered = array();
        foreach ($trainers as $trainer) {
            // Filter by location
            if ($location) {
                $trainer_location = get_user_meta($trainer->ID, 'location', true);
                if (stripos($trainer_location, $location) === false) {
                    continue;
                }
            }

            // Filter by specialization
            if ($specialization) {
                $specializations = get_user_meta($trainer->ID, 'trainer_specializations', true) ?: array();
                if (!in_array($specialization, $specializations)) {
                    continue;
                }
            }

            // Filter by rating
            if ($min_rating) {
                $rating = (float) get_user_meta($trainer->ID, 'trainer_rating', true);
                if ($rating < $min_rating) {
                    continue;
                }
            }

            // Filter by price
            if ($max_price) {
                $rate = (float) get_user_meta($trainer->ID, 'trainer_hourly_rate', true);
                if ($rate > $max_price) {
                    continue;
                }
            }

            $filtered[] = $trainer;
        }

        $data = array_map(array($this, 'format_trainer'), $filtered);

        // Get total count
        $total_args = $args;
        $total_args['number'] = -1;
        $total_args['count_total'] = true;
        $total_query = new WP_User_Query($total_args);
        $total = $total_query->get_total();

        return rest_ensure_response(array(
            'trainers' => $data,
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total / $per_page),
        ));
    }

    /**
     * Get single trainer
     */
    public function get_trainer($request) {
        $id = (int) $request->get_param('id');

        $user = get_user_by('ID', $id);

        if (!$user || !in_array('ptp_trainer', $user->roles)) {
            return new WP_Error(
                'trainer_not_found',
                'Trainer not found',
                array('status' => 404)
            );
        }

        return rest_ensure_response($this->format_trainer($user, true));
    }

    /**
     * Get trainer availability
     */
    public function get_trainer_availability($request) {
        $trainer_id = (int) $request->get_param('id');
        $date = $request->get_param('date') ?: date('Y-m-d');

        global $wpdb;
        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        // Get trainer's schedule for the date
        $booked_slots = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT start_time, end_time FROM $table_name
                 WHERE trainer_id = %d
                 AND session_date = %s
                 AND status IN ('confirmed', 'requested')",
                $trainer_id,
                $date
            ),
            ARRAY_A
        );

        // Get trainer's working hours (stored as meta)
        $working_hours = get_user_meta($trainer_id, 'trainer_working_hours', true) ?: array(
            'start' => '09:00',
            'end' => '18:00',
        );

        // Generate available slots
        $available_slots = array();
        $slot_duration = 60; // 1 hour slots
        $start = strtotime($date . ' ' . $working_hours['start']);
        $end = strtotime($date . ' ' . $working_hours['end']);

        while ($start < $end) {
            $slot_start = date('H:i', $start);
            $slot_end = date('H:i', $start + ($slot_duration * 60));

            // Check if slot is booked
            $is_available = true;
            foreach ($booked_slots as $booked) {
                if ($slot_start < $booked['end_time'] && $slot_end > $booked['start_time']) {
                    $is_available = false;
                    break;
                }
            }

            if ($is_available) {
                $available_slots[] = array(
                    'start_time' => $slot_start,
                    'end_time' => $slot_end,
                );
            }

            $start += ($slot_duration * 60);
        }

        return rest_ensure_response(array(
            'date' => $date,
            'trainer_id' => $trainer_id,
            'working_hours' => $working_hours,
            'available_slots' => $available_slots,
            'booked_slots' => $booked_slots,
        ));
    }

    /**
     * Request training session
     */
    public function request_session($request) {
        global $wpdb;
        $user = wp_get_current_user();

        $trainer_id = (int) $request->get_param('trainer_id');
        $child_id = $request->get_param('child_id');
        $date = sanitize_text_field($request->get_param('date'));
        $start_time = sanitize_text_field($request->get_param('start_time'));
        $duration = (int) $request->get_param('duration');
        $location = sanitize_text_field($request->get_param('location'));
        $focus = sanitize_textarea_field($request->get_param('focus'));
        $notes = sanitize_textarea_field($request->get_param('notes'));

        // Calculate end time
        $start = strtotime($date . ' ' . $start_time);
        $end_time = date('H:i:s', $start + ($duration * 60));

        // Get trainer rate
        $hourly_rate = (float) get_user_meta($trainer_id, 'trainer_hourly_rate', true);
        $price = $hourly_rate * ($duration / 60);

        // Check for conflicts
        $table_name = $wpdb->prefix . 'ptp_training_sessions';
        $conflict = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name
                 WHERE trainer_id = %d
                 AND session_date = %s
                 AND status IN ('confirmed', 'requested')
                 AND (
                     (start_time < %s AND end_time > %s) OR
                     (start_time >= %s AND start_time < %s)
                 )",
                $trainer_id,
                $date,
                $end_time,
                $start_time,
                $start_time,
                $end_time
            )
        );

        if ($conflict > 0) {
            return new WP_Error(
                'time_conflict',
                'This time slot is no longer available',
                array('status' => 409)
            );
        }

        // Insert session
        $wpdb->insert(
            $table_name,
            array(
                'trainer_id' => $trainer_id,
                'parent_id' => $user->ID,
                'child_id' => $child_id,
                'session_date' => $date,
                'start_time' => $start_time,
                'end_time' => $end_time,
                'location' => $location,
                'focus' => $focus,
                'player_notes' => $notes,
                'status' => 'requested',
                'price' => $price,
            ),
            array('%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f')
        );

        $session_id = $wpdb->insert_id;

        // Notify trainer
        $this->notify_trainer_new_request($trainer_id, $session_id);

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Training session requested',
            'session_id' => $session_id,
        ));
    }

    /**
     * Get my sessions
     */
    public function get_my_sessions($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $status = $request->get_param('status');

        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        // Determine if user is parent or trainer - use explicit queries for security
        $is_trainer = in_array('ptp_trainer', $user->roles);

        // Build status conditions
        $status_condition = '';
        $date_params = array();

        if ($status === 'upcoming') {
            $status_condition = " AND session_date >= %s AND status = 'confirmed'";
            $date_params[] = date('Y-m-d');
        } elseif ($status === 'past') {
            $status_condition = " AND session_date < %s";
            $date_params[] = date('Y-m-d');
        } elseif ($status === 'pending') {
            $status_condition = " AND status = 'requested'";
        }

        // Use explicit column names in separate queries to prevent SQL injection
        if ($is_trainer) {
            $query = "SELECT * FROM $table_name WHERE trainer_id = %d" . $status_condition . " ORDER BY session_date ASC, start_time ASC";
        } else {
            $query = "SELECT * FROM $table_name WHERE parent_id = %d" . $status_condition . " ORDER BY session_date ASC, start_time ASC";
        }

        $params = array_merge(array($user->ID), $date_params);

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
     * Get single session
     */
    public function get_session($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $id = (int) $request->get_param('id');

        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        $session = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id),
            ARRAY_A
        );

        if (!$session) {
            return new WP_Error(
                'session_not_found',
                'Session not found',
                array('status' => 404)
            );
        }

        // Check permission with strict type comparison
        if ((int) $session['parent_id'] !== $user->ID && (int) $session['trainer_id'] !== $user->ID) {
            return new WP_Error(
                'forbidden',
                'You do not have access to this session',
                array('status' => 403)
            );
        }

        return rest_ensure_response($this->format_session($session, true));
    }

    /**
     * Cancel session
     */
    public function cancel_session($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $id = (int) $request->get_param('id');
        $reason = sanitize_textarea_field($request->get_param('reason'));

        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        $session = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id),
            ARRAY_A
        );

        if (!$session) {
            return new WP_Error(
                'session_not_found',
                'Session not found',
                array('status' => 404)
            );
        }

        // Check permission with strict type comparison
        if ((int) $session['parent_id'] !== $user->ID && (int) $session['trainer_id'] !== $user->ID) {
            return new WP_Error(
                'forbidden',
                'You do not have access to this session',
                array('status' => 403)
            );
        }

        // Update status
        $wpdb->update(
            $table_name,
            array(
                'status' => 'cancelled',
                'trainer_notes' => $reason,
            ),
            array('id' => $id),
            array('%s', '%s'),
            array('%d')
        );

        // Notify other party
        $notify_user_id = ($user->ID == $session['parent_id']) ? $session['trainer_id'] : $session['parent_id'];
        $this->notify_session_cancelled($notify_user_id, $id, $reason);

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Session cancelled',
        ));
    }

    /**
     * Get children
     */
    public function get_children($request) {
        global $wpdb;
        $user = wp_get_current_user();

        $table_name = $wpdb->prefix . 'ptp_children';

        $children = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE parent_id = %d ORDER BY first_name ASC",
                $user->ID
            ),
            ARRAY_A
        );

        $data = array_map(array($this, 'format_child'), $children);

        return rest_ensure_response(array(
            'children' => $data,
        ));
    }

    /**
     * Add child
     */
    public function add_child($request) {
        global $wpdb;
        $user = wp_get_current_user();

        $wpdb->insert(
            $wpdb->prefix . 'ptp_children',
            array(
                'parent_id' => $user->ID,
                'first_name' => sanitize_text_field($request->get_param('first_name')),
                'last_name' => sanitize_text_field($request->get_param('last_name')),
                'date_of_birth' => sanitize_text_field($request->get_param('date_of_birth')),
                'age_band' => sanitize_text_field($request->get_param('age_band')),
                'skill_level' => sanitize_text_field($request->get_param('skill_level')),
                'position' => sanitize_text_field($request->get_param('position')),
                'team' => sanitize_text_field($request->get_param('team')),
                'notes' => sanitize_textarea_field($request->get_param('notes')),
            ),
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')
        );

        $child_id = $wpdb->insert_id;

        return rest_ensure_response(array(
            'success' => true,
            'child_id' => $child_id,
            'message' => 'Child profile created',
        ));
    }

    /**
     * Update child
     */
    public function update_child($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $id = (int) $request->get_param('id');

        $table_name = $wpdb->prefix . 'ptp_children';

        // Verify ownership
        $child = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d AND parent_id = %d", $id, $user->ID)
        );

        if (!$child) {
            return new WP_Error(
                'child_not_found',
                'Child profile not found',
                array('status' => 404)
            );
        }

        $params = $request->get_json_params();
        $update_data = array();
        $update_format = array();

        $allowed_fields = array('first_name', 'last_name', 'date_of_birth', 'age_band', 'skill_level', 'position', 'team', 'notes', 'avatar_url');

        foreach ($allowed_fields as $field) {
            if (isset($params[$field])) {
                $update_data[$field] = sanitize_text_field($params[$field]);
                $update_format[] = '%s';
            }
        }

        if (!empty($update_data)) {
            $wpdb->update(
                $table_name,
                $update_data,
                array('id' => $id),
                $update_format,
                array('%d')
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Child profile updated',
        ));
    }

    /**
     * Delete child
     */
    public function delete_child($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $id = (int) $request->get_param('id');

        $table_name = $wpdb->prefix . 'ptp_children';

        // Verify ownership
        $deleted = $wpdb->delete(
            $table_name,
            array('id' => $id, 'parent_id' => $user->ID),
            array('%d', '%d')
        );

        if (!$deleted) {
            return new WP_Error(
                'child_not_found',
                'Child profile not found',
                array('status' => 404)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Child profile deleted',
        ));
    }

    /**
     * Format trainer for API response
     */
    private function format_trainer($user, $include_details = false) {
        $data = array(
            'id' => $user->ID,
            'name' => $user->display_name,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'avatar_url' => get_user_meta($user->ID, 'avatar_url', true) ?: get_avatar_url($user->ID),
            'bio' => get_user_meta($user->ID, 'trainer_bio', true),
            'hourly_rate' => (float) get_user_meta($user->ID, 'trainer_hourly_rate', true),
            'specializations' => get_user_meta($user->ID, 'trainer_specializations', true) ?: array(),
            'rating' => (float) get_user_meta($user->ID, 'trainer_rating', true),
            'total_reviews' => (int) get_user_meta($user->ID, 'trainer_total_reviews', true),
            'location' => get_user_meta($user->ID, 'location', true),
        );

        if ($include_details) {
            $data['certifications'] = get_user_meta($user->ID, 'trainer_certifications', true) ?: array();
            $data['experience_years'] = (int) get_user_meta($user->ID, 'trainer_experience_years', true);
            $data['education'] = get_user_meta($user->ID, 'trainer_education', true);
            $data['working_hours'] = get_user_meta($user->ID, 'trainer_working_hours', true) ?: array(
                'start' => '09:00',
                'end' => '18:00',
            );
            $data['gallery'] = get_user_meta($user->ID, 'trainer_gallery', true) ?: array();

            // Get reviews
            $data['reviews'] = $this->get_trainer_reviews($user->ID);
        }

        return $data;
    }

    /**
     * Get trainer reviews
     */
    private function get_trainer_reviews($trainer_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        $reviews = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT s.*, u.display_name as reviewer_name
                 FROM $table_name s
                 LEFT JOIN {$wpdb->users} u ON s.parent_id = u.ID
                 WHERE s.trainer_id = %d
                 AND s.status = 'completed'
                 AND s.trainer_notes IS NOT NULL
                 ORDER BY s.updated_at DESC
                 LIMIT 10",
                $trainer_id
            ),
            ARRAY_A
        );

        return array_map(function($review) {
            return array(
                'id' => (int) $review['id'],
                'reviewer_name' => $review['reviewer_name'],
                'rating' => (int) get_post_meta($review['id'], '_session_rating', true),
                'comment' => $review['trainer_notes'],
                'date' => $review['updated_at'],
            );
        }, $reviews ?: array());
    }

    /**
     * Format session for API response
     */
    private function format_session($session, $include_details = false) {
        $trainer = get_user_by('ID', $session['trainer_id']);
        $parent = get_user_by('ID', $session['parent_id']);

        $data = array(
            'id' => (int) $session['id'],
            'trainer' => array(
                'id' => (int) $session['trainer_id'],
                'name' => $trainer ? $trainer->display_name : 'Unknown',
                'avatar_url' => $trainer ? (get_user_meta($trainer->ID, 'avatar_url', true) ?: get_avatar_url($trainer->ID)) : null,
            ),
            'parent' => array(
                'id' => (int) $session['parent_id'],
                'name' => $parent ? $parent->display_name : 'Unknown',
            ),
            'date' => $session['session_date'],
            'start_time' => $session['start_time'],
            'end_time' => $session['end_time'],
            'location' => $session['location'],
            'status' => $session['status'],
            'price' => (float) $session['price'],
            'is_paid' => (bool) $session['is_paid'],
        );

        if ($session['child_id']) {
            global $wpdb;
            $child = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM {$wpdb->prefix}ptp_children WHERE id = %d",
                    $session['child_id']
                ),
                ARRAY_A
            );
            if ($child) {
                $data['child'] = $this->format_child($child);
            }
        }

        if ($include_details) {
            $data['focus'] = $session['focus'];
            $data['player_notes'] = $session['player_notes'];
            $data['trainer_notes'] = $session['trainer_notes'];
            $data['created_at'] = $session['created_at'];
            $data['updated_at'] = $session['updated_at'];
        }

        return $data;
    }

    /**
     * Format child for API response
     */
    private function format_child($child) {
        return array(
            'id' => (int) $child['id'],
            'first_name' => $child['first_name'],
            'last_name' => $child['last_name'],
            'date_of_birth' => $child['date_of_birth'],
            'age_band' => $child['age_band'],
            'skill_level' => $child['skill_level'],
            'position' => $child['position'],
            'team' => $child['team'],
            'notes' => $child['notes'],
            'avatar_url' => $child['avatar_url'],
        );
    }

    /**
     * Notify trainer of new request
     */
    private function notify_trainer_new_request($trainer_id, $session_id) {
        $push_token = get_user_meta($trainer_id, 'push_token', true);
        if ($push_token) {
            // Send push notification (implementation depends on push service)
            do_action('ptp_send_push_notification', $push_token, array(
                'title' => 'New Training Request',
                'body' => 'You have a new training session request',
                'data' => array(
                    'type' => 'session_request',
                    'session_id' => $session_id,
                ),
            ));
        }
    }

    /**
     * Notify user of cancelled session
     */
    private function notify_session_cancelled($user_id, $session_id, $reason) {
        $push_token = get_user_meta($user_id, 'push_token', true);
        if ($push_token) {
            do_action('ptp_send_push_notification', $push_token, array(
                'title' => 'Session Cancelled',
                'body' => 'A training session has been cancelled',
                'data' => array(
                    'type' => 'session_cancelled',
                    'session_id' => $session_id,
                    'reason' => $reason,
                ),
            ));
        }
    }
}
