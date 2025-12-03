<?php
/**
 * Events Controller
 *
 * Handles user schedule/events endpoints for the PTP Mobile API.
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PTP_Events_Controller class
 */
class PTP_Events_Controller {

    /**
     * REST namespace
     */
    private $namespace = 'ptp/v1';

    /**
     * Register routes
     */
    public function register_routes() {
        // Get user's events/schedule
        register_rest_route($this->namespace, '/events', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_events'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'start_date' => array(
                    'type' => 'string',
                    'format' => 'date',
                ),
                'end_date' => array(
                    'type' => 'string',
                    'format' => 'date',
                ),
                'type' => array(
                    'type' => 'string',
                    'enum' => array('all', 'program', 'training'),
                    'default' => 'all',
                ),
            ),
        ));

        // Get upcoming events
        register_rest_route($this->namespace, '/events/upcoming', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_upcoming_events'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'limit' => array(
                    'type' => 'integer',
                    'default' => 10,
                ),
            ),
        ));

        // Get single event
        register_rest_route($this->namespace, '/events/(?P<type>[a-z]+)/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_event'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'type' => array(
                    'required' => true,
                    'type' => 'string',
                    'enum' => array('program', 'training'),
                ),
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
            ),
        ));

        // Get events for a specific date
        register_rest_route($this->namespace, '/events/date/(?P<date>[0-9-]+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_events_for_date'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'date' => array(
                    'required' => true,
                    'type' => 'string',
                    'format' => 'date',
                ),
            ),
        ));

        // Get calendar data (dates with events)
        register_rest_route($this->namespace, '/events/calendar', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_calendar_data'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'month' => array(
                    'type' => 'integer',
                    'minimum' => 1,
                    'maximum' => 12,
                ),
                'year' => array(
                    'type' => 'integer',
                ),
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
     * Get events
     */
    public function get_events($request) {
        $user = wp_get_current_user();
        $start_date = $request->get_param('start_date') ?: date('Y-m-d');
        $end_date = $request->get_param('end_date') ?: date('Y-m-d', strtotime('+3 months'));
        $type = $request->get_param('type');

        $events = array();

        // Get program events (camps/clinics registrations)
        if ($type === 'all' || $type === 'program') {
            $program_events = $this->get_program_events($user, $start_date, $end_date);
            $events = array_merge($events, $program_events);
        }

        // Get training session events
        if ($type === 'all' || $type === 'training') {
            $training_events = $this->get_training_events($user, $start_date, $end_date);
            $events = array_merge($events, $training_events);
        }

        // Sort by date
        usort($events, function($a, $b) {
            $date_a = $a['date'] . ' ' . ($a['start_time'] ?? '00:00');
            $date_b = $b['date'] . ' ' . ($b['start_time'] ?? '00:00');
            return strtotime($date_a) - strtotime($date_b);
        });

        return rest_ensure_response(array(
            'events' => $events,
        ));
    }

    /**
     * Get upcoming events
     */
    public function get_upcoming_events($request) {
        $user = wp_get_current_user();
        $limit = (int) $request->get_param('limit');

        // Get events for next 3 months
        $all_events = $this->get_all_events($user, date('Y-m-d'), date('Y-m-d', strtotime('+3 months')));

        // Filter to only future events and sort
        $upcoming = array_filter($all_events, function($event) {
            $event_datetime = $event['date'] . ' ' . ($event['start_time'] ?? '23:59');
            return strtotime($event_datetime) > time();
        });

        usort($upcoming, function($a, $b) {
            $date_a = $a['date'] . ' ' . ($a['start_time'] ?? '00:00');
            $date_b = $b['date'] . ' ' . ($b['start_time'] ?? '00:00');
            return strtotime($date_a) - strtotime($date_b);
        });

        // Limit results
        $upcoming = array_slice($upcoming, 0, $limit);

        return rest_ensure_response(array(
            'events' => array_values($upcoming),
        ));
    }

    /**
     * Get single event
     */
    public function get_event($request) {
        $user = wp_get_current_user();
        $type = $request->get_param('type');
        $id = (int) $request->get_param('id');

        if ($type === 'program') {
            return $this->get_program_event_detail($user, $id);
        } elseif ($type === 'training') {
            return $this->get_training_event_detail($user, $id);
        }

        return new WP_Error(
            'invalid_type',
            'Invalid event type',
            array('status' => 400)
        );
    }

    /**
     * Get events for a specific date
     */
    public function get_events_for_date($request) {
        $user = wp_get_current_user();
        $date = sanitize_text_field($request->get_param('date'));

        $events = $this->get_all_events($user, $date, $date);

        return rest_ensure_response(array(
            'date' => $date,
            'events' => $events,
        ));
    }

    /**
     * Get calendar data
     */
    public function get_calendar_data($request) {
        $user = wp_get_current_user();
        $month = $request->get_param('month') ?: (int) date('n');
        $year = $request->get_param('year') ?: (int) date('Y');

        $start_date = sprintf('%04d-%02d-01', $year, $month);
        $end_date = date('Y-m-t', strtotime($start_date));

        $events = $this->get_all_events($user, $start_date, $end_date);

        // Group events by date
        $dates_with_events = array();
        foreach ($events as $event) {
            $date = $event['date'];
            if (!isset($dates_with_events[$date])) {
                $dates_with_events[$date] = array(
                    'date' => $date,
                    'count' => 0,
                    'types' => array(),
                );
            }
            $dates_with_events[$date]['count']++;
            if (!in_array($event['type'], $dates_with_events[$date]['types'])) {
                $dates_with_events[$date]['types'][] = $event['type'];
            }
        }

        return rest_ensure_response(array(
            'month' => $month,
            'year' => $year,
            'dates' => array_values($dates_with_events),
        ));
    }

    /**
     * Get all events for user
     */
    private function get_all_events($user, $start_date, $end_date) {
        $events = array();

        $program_events = $this->get_program_events($user, $start_date, $end_date);
        $training_events = $this->get_training_events($user, $start_date, $end_date);

        $events = array_merge($program_events, $training_events);

        // Sort by date and time
        usort($events, function($a, $b) {
            $date_a = $a['date'] . ' ' . ($a['start_time'] ?? '00:00');
            $date_b = $b['date'] . ' ' . ($b['start_time'] ?? '00:00');
            return strtotime($date_a) - strtotime($date_b);
        });

        return $events;
    }

    /**
     * Get program events (camps/clinics)
     */
    private function get_program_events($user, $start_date, $end_date) {
        $events = array();

        // Get user's orders with camp/clinic products
        $orders = wc_get_orders(array(
            'customer_id' => $user->ID,
            'status' => array('completed', 'processing'),
            'limit' => -1,
        ));

        foreach ($orders as $order) {
            foreach ($order->get_items() as $item) {
                $product = $item->get_product();
                if (!$product) continue;

                // Check if it's a camp or clinic
                $categories = wp_get_post_terms($product->get_id(), 'product_cat', array('fields' => 'slugs'));
                if (!array_intersect($categories, array('camp', 'clinic'))) {
                    continue;
                }

                $program_start = get_post_meta($product->get_id(), '_ptp_start_date', true);
                $program_end = get_post_meta($product->get_id(), '_ptp_end_date', true);

                // Check if program overlaps with date range
                if ($program_end < $start_date || $program_start > $end_date) {
                    continue;
                }

                // Generate events for each day of the program
                $current = max($program_start, $start_date);
                $end = min($program_end, $end_date);

                while ($current <= $end) {
                    $events[] = array(
                        'id' => $product->get_id(),
                        'type' => 'program',
                        'program_type' => in_array('camp', $categories) ? 'camp' : 'clinic',
                        'title' => $product->get_name(),
                        'date' => $current,
                        'start_time' => get_post_meta($product->get_id(), '_ptp_start_time', true),
                        'end_time' => get_post_meta($product->get_id(), '_ptp_end_time', true),
                        'location' => get_post_meta($product->get_id(), '_ptp_location', true),
                        'child_name' => $item->get_meta('_child_name'),
                        'image_url' => wp_get_attachment_url($product->get_image_id()),
                    );

                    $current = date('Y-m-d', strtotime($current . ' +1 day'));
                }
            }
        }

        return $events;
    }

    /**
     * Get training session events
     */
    private function get_training_events($user, $start_date, $end_date) {
        global $wpdb;
        $events = array();

        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        // Determine if user is parent or trainer
        $is_trainer = in_array('ptp_trainer', $user->roles);
        $user_column = $is_trainer ? 'trainer_id' : 'parent_id';

        $sessions = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_name
                 WHERE $user_column = %d
                 AND session_date BETWEEN %s AND %s
                 AND status IN ('confirmed', 'completed')",
                $user->ID,
                $start_date,
                $end_date
            ),
            ARRAY_A
        );

        foreach ($sessions as $session) {
            $trainer = get_user_by('ID', $session['trainer_id']);
            $parent = get_user_by('ID', $session['parent_id']);

            // Get child info if available
            $child_name = null;
            if ($session['child_id']) {
                $child = $wpdb->get_row(
                    $wpdb->prepare(
                        "SELECT * FROM {$wpdb->prefix}ptp_children WHERE id = %d",
                        $session['child_id']
                    ),
                    ARRAY_A
                );
                if ($child) {
                    $child_name = $child['first_name'] . ' ' . $child['last_name'];
                }
            }

            $events[] = array(
                'id' => (int) $session['id'],
                'type' => 'training',
                'title' => $is_trainer
                    ? 'Session with ' . ($parent ? $parent->display_name : 'Unknown')
                    : 'Training with ' . ($trainer ? $trainer->display_name : 'Unknown'),
                'date' => $session['session_date'],
                'start_time' => $session['start_time'],
                'end_time' => $session['end_time'],
                'location' => $session['location'],
                'trainer' => $trainer ? array(
                    'id' => $trainer->ID,
                    'name' => $trainer->display_name,
                    'avatar_url' => get_user_meta($trainer->ID, 'avatar_url', true) ?: get_avatar_url($trainer->ID),
                ) : null,
                'parent' => $parent ? array(
                    'id' => $parent->ID,
                    'name' => $parent->display_name,
                ) : null,
                'child_name' => $child_name,
                'status' => $session['status'],
                'focus' => $session['focus'],
            );
        }

        return $events;
    }

    /**
     * Get program event detail
     */
    private function get_program_event_detail($user, $product_id) {
        $product = wc_get_product($product_id);

        if (!$product) {
            return new WP_Error(
                'event_not_found',
                'Event not found',
                array('status' => 404)
            );
        }

        // Verify user has registered for this program
        $orders = wc_get_orders(array(
            'customer_id' => $user->ID,
            'status' => array('completed', 'processing'),
            'limit' => -1,
        ));

        $registration = null;
        foreach ($orders as $order) {
            foreach ($order->get_items() as $item) {
                if ($item->get_product_id() == $product_id) {
                    $registration = array(
                        'order_id' => $order->get_id(),
                        'child_name' => $item->get_meta('_child_name'),
                    );
                    break 2;
                }
            }
        }

        if (!$registration) {
            return new WP_Error(
                'not_registered',
                'You are not registered for this program',
                array('status' => 403)
            );
        }

        $categories = wp_get_post_terms($product_id, 'product_cat', array('fields' => 'slugs'));

        return rest_ensure_response(array(
            'event' => array(
                'id' => $product_id,
                'type' => 'program',
                'program_type' => in_array('camp', $categories) ? 'camp' : 'clinic',
                'title' => $product->get_name(),
                'description' => $product->get_description(),
                'start_date' => get_post_meta($product_id, '_ptp_start_date', true),
                'end_date' => get_post_meta($product_id, '_ptp_end_date', true),
                'start_time' => get_post_meta($product_id, '_ptp_start_time', true),
                'end_time' => get_post_meta($product_id, '_ptp_end_time', true),
                'location' => get_post_meta($product_id, '_ptp_location', true),
                'address' => get_post_meta($product_id, '_ptp_address', true),
                'what_to_bring' => get_post_meta($product_id, '_ptp_what_to_bring', true),
                'schedule' => get_post_meta($product_id, '_ptp_schedule', true),
                'image_url' => wp_get_attachment_url($product->get_image_id()),
                'registration' => $registration,
            ),
        ));
    }

    /**
     * Get training event detail
     */
    private function get_training_event_detail($user, $session_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'ptp_training_sessions';

        $session = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $session_id),
            ARRAY_A
        );

        if (!$session) {
            return new WP_Error(
                'event_not_found',
                'Event not found',
                array('status' => 404)
            );
        }

        // Verify user has access
        if ($session['parent_id'] != $user->ID && $session['trainer_id'] != $user->ID) {
            return new WP_Error(
                'forbidden',
                'You do not have access to this event',
                array('status' => 403)
            );
        }

        $trainer = get_user_by('ID', $session['trainer_id']);
        $parent = get_user_by('ID', $session['parent_id']);

        // Get child info
        $child = null;
        if ($session['child_id']) {
            $child = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM {$wpdb->prefix}ptp_children WHERE id = %d",
                    $session['child_id']
                ),
                ARRAY_A
            );
        }

        return rest_ensure_response(array(
            'event' => array(
                'id' => (int) $session['id'],
                'type' => 'training',
                'title' => 'Private Training Session',
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
                'trainer' => $trainer ? array(
                    'id' => $trainer->ID,
                    'name' => $trainer->display_name,
                    'avatar_url' => get_user_meta($trainer->ID, 'avatar_url', true) ?: get_avatar_url($trainer->ID),
                    'phone' => get_user_meta($trainer->ID, 'phone', true),
                ) : null,
                'parent' => $parent ? array(
                    'id' => $parent->ID,
                    'name' => $parent->display_name,
                    'phone' => get_user_meta($parent->ID, 'phone', true),
                ) : null,
                'child' => $child ? array(
                    'id' => (int) $child['id'],
                    'name' => $child['first_name'] . ' ' . $child['last_name'],
                    'age_band' => $child['age_band'],
                    'skill_level' => $child['skill_level'],
                    'position' => $child['position'],
                ) : null,
            ),
        ));
    }
}
