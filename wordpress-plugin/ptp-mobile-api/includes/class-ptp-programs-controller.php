<?php
/**
 * Programs Controller
 *
 * Handles camps and clinics endpoints for the PTP Mobile API.
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PTP_Programs_Controller class
 */
class PTP_Programs_Controller {

    /**
     * REST namespace
     */
    private $namespace = 'ptp/v2';

    /**
     * Register routes
     */
    public function register_routes() {
        // Get all programs (camps & clinics)
        register_rest_route($this->namespace, '/programs', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_programs'),
            'permission_callback' => '__return_true',
            'args' => array(
                'type' => array(
                    'type' => 'string',
                    'enum' => array('camp', 'clinic', 'all'),
                    'default' => 'all',
                ),
                'age_group' => array(
                    'type' => 'string',
                ),
                'location' => array(
                    'type' => 'string',
                ),
                'date_from' => array(
                    'type' => 'string',
                    'format' => 'date',
                ),
                'date_to' => array(
                    'type' => 'string',
                    'format' => 'date',
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

        // Get single program
        register_rest_route($this->namespace, '/programs/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_program'),
            'permission_callback' => '__return_true',
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
            ),
        ));

        // Get featured programs
        register_rest_route($this->namespace, '/programs/featured', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_featured_programs'),
            'permission_callback' => '__return_true',
        ));

        // Get upcoming programs
        register_rest_route($this->namespace, '/programs/upcoming', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_upcoming_programs'),
            'permission_callback' => '__return_true',
            'args' => array(
                'limit' => array(
                    'type' => 'integer',
                    'default' => 10,
                ),
            ),
        ));

        // Get program locations/markets
        register_rest_route($this->namespace, '/programs/locations', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_locations'),
            'permission_callback' => '__return_true',
        ));

        // Get program age groups
        register_rest_route($this->namespace, '/programs/age-groups', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_age_groups'),
            'permission_callback' => '__return_true',
        ));

        // Get user's registered programs
        register_rest_route($this->namespace, '/programs/my-registrations', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_my_registrations'),
            'permission_callback' => array($this, 'check_auth'),
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
     * Get programs
     */
    public function get_programs($request) {
        $type = $request->get_param('type');
        $age_group = $request->get_param('age_group');
        $location = $request->get_param('location');
        $date_from = $request->get_param('date_from');
        $date_to = $request->get_param('date_to');
        $search = $request->get_param('search');
        $page = (int) $request->get_param('page');
        $per_page = (int) $request->get_param('per_page');

        // Build WooCommerce product query
        $args = array(
            'status' => 'publish',
            'limit' => $per_page,
            'offset' => ($page - 1) * $per_page,
            'orderby' => 'meta_value',
            'meta_key' => '_ptp_start_date',
            'order' => 'ASC',
        );

        // Filter by type (product category)
        if ($type && $type !== 'all') {
            $args['category'] = array($type);
        } else {
            $args['category'] = array('camp', 'clinic');
        }

        // Search
        if ($search) {
            $args['s'] = $search;
        }

        // Get products
        $products = wc_get_products($args);

        // Additional filtering
        $filtered_products = array();
        foreach ($products as $product) {
            // Filter by age group
            if ($age_group) {
                $product_age_groups = get_post_meta($product->get_id(), '_ptp_age_groups', true);
                if (!in_array($age_group, (array) $product_age_groups)) {
                    continue;
                }
            }

            // Filter by location
            if ($location) {
                $product_location = get_post_meta($product->get_id(), '_ptp_location', true);
                if (stripos($product_location, $location) === false) {
                    continue;
                }
            }

            // Filter by date range
            $start_date = get_post_meta($product->get_id(), '_ptp_start_date', true);
            if ($date_from && $start_date < $date_from) {
                continue;
            }
            if ($date_to && $start_date > $date_to) {
                continue;
            }

            $filtered_products[] = $product;
        }

        // Format response
        $data = array_map(array($this, 'format_program'), $filtered_products);

        // Get total count for pagination
        $total_args = $args;
        $total_args['limit'] = -1;
        $total_args['return'] = 'ids';
        $total = count(wc_get_products($total_args));

        return rest_ensure_response(array(
            'programs' => $data,
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total / $per_page),
        ));
    }

    /**
     * Get single program
     */
    public function get_program($request) {
        $id = (int) $request->get_param('id');

        $product = wc_get_product($id);

        if (!$product) {
            return new WP_Error(
                'program_not_found',
                'Program not found',
                array('status' => 404)
            );
        }

        return rest_ensure_response($this->format_program($product, true));
    }

    /**
     * Get featured programs
     */
    public function get_featured_programs($request) {
        $products = wc_get_products(array(
            'status' => 'publish',
            'featured' => true,
            'category' => array('camp', 'clinic'),
            'limit' => 10,
            'orderby' => 'meta_value',
            'meta_key' => '_ptp_start_date',
            'order' => 'ASC',
        ));

        // Filter to only show upcoming
        $upcoming = array_filter($products, function($product) {
            $start_date = get_post_meta($product->get_id(), '_ptp_start_date', true);
            return $start_date >= date('Y-m-d');
        });

        $data = array_map(array($this, 'format_program'), $upcoming);

        return rest_ensure_response(array(
            'programs' => array_values($data),
        ));
    }

    /**
     * Get upcoming programs
     */
    public function get_upcoming_programs($request) {
        $limit = (int) $request->get_param('limit');

        $products = wc_get_products(array(
            'status' => 'publish',
            'category' => array('camp', 'clinic'),
            'limit' => $limit * 2, // Get extra to filter
            'orderby' => 'meta_value',
            'meta_key' => '_ptp_start_date',
            'order' => 'ASC',
            'meta_query' => array(
                array(
                    'key' => '_ptp_start_date',
                    'value' => date('Y-m-d'),
                    'compare' => '>=',
                    'type' => 'DATE',
                ),
            ),
        ));

        // Limit results
        $products = array_slice($products, 0, $limit);

        $data = array_map(array($this, 'format_program'), $products);

        return rest_ensure_response(array(
            'programs' => $data,
        ));
    }

    /**
     * Get locations
     */
    public function get_locations($request) {
        // Get unique locations from products
        global $wpdb;

        $locations = $wpdb->get_col(
            "SELECT DISTINCT meta_value FROM {$wpdb->postmeta}
             WHERE meta_key = '_ptp_location'
             AND meta_value != ''
             ORDER BY meta_value ASC"
        );

        // Format as location objects
        $data = array_map(function($location, $index) {
            return array(
                'id' => $index + 1,
                'name' => $location,
                'slug' => sanitize_title($location),
            );
        }, $locations, array_keys($locations));

        return rest_ensure_response(array(
            'locations' => $data,
        ));
    }

    /**
     * Get age groups
     */
    public function get_age_groups($request) {
        // Predefined age groups
        $age_groups = array(
            array('id' => 'u6', 'name' => 'Under 6', 'min_age' => 4, 'max_age' => 5),
            array('id' => 'u8', 'name' => 'Under 8', 'min_age' => 6, 'max_age' => 7),
            array('id' => 'u10', 'name' => 'Under 10', 'min_age' => 8, 'max_age' => 9),
            array('id' => 'u12', 'name' => 'Under 12', 'min_age' => 10, 'max_age' => 11),
            array('id' => 'u14', 'name' => 'Under 14', 'min_age' => 12, 'max_age' => 13),
            array('id' => 'u16', 'name' => 'Under 16', 'min_age' => 14, 'max_age' => 15),
            array('id' => 'u18', 'name' => 'Under 18', 'min_age' => 16, 'max_age' => 17),
            array('id' => 'adult', 'name' => 'Adult', 'min_age' => 18, 'max_age' => null),
        );

        return rest_ensure_response(array(
            'age_groups' => $age_groups,
        ));
    }

    /**
     * Get user's registered programs
     */
    public function get_my_registrations($request) {
        $user = wp_get_current_user();

        // Get user's orders
        $orders = wc_get_orders(array(
            'customer_id' => $user->ID,
            'status' => array('completed', 'processing'),
            'limit' => -1,
        ));

        $registrations = array();

        foreach ($orders as $order) {
            foreach ($order->get_items() as $item) {
                $product = $item->get_product();
                if (!$product) continue;

                // Check if it's a camp or clinic
                $categories = wp_get_post_terms($product->get_id(), 'product_cat', array('fields' => 'slugs'));
                if (!array_intersect($categories, array('camp', 'clinic'))) {
                    continue;
                }

                $registrations[] = array(
                    'order_id' => $order->get_id(),
                    'order_date' => $order->get_date_created()->format('Y-m-d H:i:s'),
                    'program' => $this->format_program($product),
                    'child_name' => $item->get_meta('_child_name'),
                    'status' => $order->get_status(),
                );
            }
        }

        return rest_ensure_response(array(
            'registrations' => $registrations,
        ));
    }

    /**
     * Format program for API response
     */
    private function format_program($product, $include_details = false) {
        $id = $product->get_id();

        // Get categories
        $categories = wp_get_post_terms($id, 'product_cat', array('fields' => 'slugs'));
        $type = in_array('camp', $categories) ? 'camp' : 'clinic';

        // Get images
        $image_id = $product->get_image_id();
        $gallery_ids = $product->get_gallery_image_ids();

        $images = array();
        if ($image_id) {
            $images[] = wp_get_attachment_url($image_id);
        }
        foreach ($gallery_ids as $gallery_id) {
            $images[] = wp_get_attachment_url($gallery_id);
        }

        $data = array(
            'id' => $id,
            'title' => $product->get_name(),
            'type' => $type,
            'description' => $product->get_short_description(),
            'price' => (float) $product->get_price(),
            'regular_price' => (float) $product->get_regular_price(),
            'sale_price' => $product->get_sale_price() ? (float) $product->get_sale_price() : null,
            'on_sale' => $product->is_on_sale(),
            'image_url' => $images[0] ?? null,
            'images' => $images,
            'location' => get_post_meta($id, '_ptp_location', true),
            'address' => get_post_meta($id, '_ptp_address', true),
            'start_date' => get_post_meta($id, '_ptp_start_date', true),
            'end_date' => get_post_meta($id, '_ptp_end_date', true),
            'start_time' => get_post_meta($id, '_ptp_start_time', true),
            'end_time' => get_post_meta($id, '_ptp_end_time', true),
            'age_groups' => get_post_meta($id, '_ptp_age_groups', true) ?: array(),
            'skill_levels' => get_post_meta($id, '_ptp_skill_levels', true) ?: array(),
            'spots_available' => (int) get_post_meta($id, '_ptp_spots_available', true),
            'max_capacity' => (int) get_post_meta($id, '_ptp_max_capacity', true),
            'is_featured' => $product->is_featured(),
            'stock_status' => $product->get_stock_status(),
        );

        // Add detailed info for single program view
        if ($include_details) {
            $data['full_description'] = $product->get_description();
            $data['what_to_bring'] = get_post_meta($id, '_ptp_what_to_bring', true);
            $data['schedule'] = get_post_meta($id, '_ptp_schedule', true);
            $data['trainers'] = $this->get_program_trainers($id);
            $data['faqs'] = get_post_meta($id, '_ptp_faqs', true) ?: array();
            $data['checkout_url'] = $product->add_to_cart_url();
        }

        return $data;
    }

    /**
     * Get trainers associated with a program
     */
    private function get_program_trainers($product_id) {
        $trainer_ids = get_post_meta($product_id, '_ptp_trainer_ids', true);

        if (empty($trainer_ids)) {
            return array();
        }

        $trainers = array();
        foreach ((array) $trainer_ids as $trainer_id) {
            $user = get_user_by('ID', $trainer_id);
            if (!$user) continue;

            $trainers[] = array(
                'id' => $user->ID,
                'name' => $user->display_name,
                'avatar_url' => get_user_meta($user->ID, 'avatar_url', true) ?: get_avatar_url($user->ID),
                'bio' => get_user_meta($user->ID, 'trainer_bio', true),
            );
        }

        return $trainers;
    }
}
