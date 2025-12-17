<?php
/**
 * Plugin Name: PTP WooCommerce Bridge
 * Description: Connects WooCommerce products to the PTP Mobile App API
 * Version: 1.0.0
 * Author: PTP
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register REST API endpoints for mobile app
 */
add_action('rest_api_init', function () {

    // GET /wp-json/ptp/v1/programs - List all camps/clinics
    register_rest_route('ptp/v1', '/programs', [
        'methods' => 'GET',
        'callback' => 'ptp_get_programs',
        'permission_callback' => '__return_true',
    ]);

    // GET /wp-json/ptp/v1/programs/(?P<id>\d+) - Get single program
    register_rest_route('ptp/v1', '/programs/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'ptp_get_program',
        'permission_callback' => '__return_true',
    ]);

    // GET /wp-json/ptp/v1/programs/featured - Get featured programs
    register_rest_route('ptp/v1', '/programs/featured', [
        'methods' => 'GET',
        'callback' => 'ptp_get_featured_programs',
        'permission_callback' => '__return_true',
    ]);

    // GET /wp-json/ptp/v1/markets - Get available locations
    register_rest_route('ptp/v1', '/markets', [
        'methods' => 'GET',
        'callback' => 'ptp_get_markets',
        'permission_callback' => '__return_true',
    ]);

    // GET /wp-json/ptp/v1/trainers - List trainers
    register_rest_route('ptp/v1', '/trainers', [
        'methods' => 'GET',
        'callback' => 'ptp_get_trainers',
        'permission_callback' => '__return_true',
    ]);

    // GET /wp-json/ptp/v1/trainers/(?P<id>\d+) - Get single trainer
    register_rest_route('ptp/v1', '/trainers/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'ptp_get_trainer',
        'permission_callback' => '__return_true',
    ]);
});

/**
 * Get programs (camps and clinics) from WooCommerce
 */
function ptp_get_programs(WP_REST_Request $request) {
    $page = $request->get_param('page') ?: 1;
    $per_page = $request->get_param('per_page') ?: 20;
    $type = $request->get_param('type'); // 'camp' or 'clinic'
    $state = $request->get_param('state');
    $city = $request->get_param('city');
    $market = $request->get_param('market');
    $age_band = $request->get_param('age_band');

    // Query WooCommerce products
    $args = [
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => [],
        'tax_query' => [],
    ];

    // Filter by product category (camps or clinics)
    $categories = [];
    if ($type === 'camp') {
        $categories = ['summer-camps', 'summer', 'camps'];
    } elseif ($type === 'clinic') {
        $categories = ['winter-clinics', 'clinics', 'clinic'];
    } else {
        // Get both camps and clinics
        $categories = ['summer-camps', 'summer', 'camps', 'winter-clinics', 'clinics', 'clinic'];
    }

    if (!empty($categories)) {
        $args['tax_query'][] = [
            'taxonomy' => 'product_cat',
            'field' => 'slug',
            'terms' => $categories,
            'operator' => 'IN',
        ];
    }

    // Filter by location meta
    if ($state) {
        $args['meta_query'][] = [
            'key' => '_camp_state',
            'value' => $state,
            'compare' => '=',
        ];
    }

    if ($city) {
        $args['meta_query'][] = [
            'key' => '_camp_city',
            'value' => $city,
            'compare' => 'LIKE',
        ];
    }

    if ($market) {
        $args['meta_query'][] = [
            'key' => '_market_slug',
            'value' => $market,
            'compare' => '=',
        ];
    }

    $query = new WP_Query($args);
    $programs = [];

    foreach ($query->posts as $post) {
        $product = wc_get_product($post->ID);
        if (!$product) continue;

        $programs[] = ptp_format_program($product);
    }

    return [
        'programs' => $programs,
        'total' => $query->found_posts,
        'page' => (int) $page,
        'per_page' => (int) $per_page,
        'total_pages' => $query->max_num_pages,
    ];
}

/**
 * Get a single program by ID
 */
function ptp_get_program(WP_REST_Request $request) {
    $id = $request->get_param('id');
    $product = wc_get_product($id);

    if (!$product) {
        return new WP_Error('not_found', 'Program not found', ['status' => 404]);
    }

    return ptp_format_program($product, true);
}

/**
 * Get featured/bestseller programs
 */
function ptp_get_featured_programs(WP_REST_Request $request) {
    $args = [
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => 6,
        'tax_query' => [
            [
                'taxonomy' => 'product_visibility',
                'field' => 'name',
                'terms' => 'featured',
            ],
        ],
    ];

    $query = new WP_Query($args);
    $programs = [];

    foreach ($query->posts as $post) {
        $product = wc_get_product($post->ID);
        if (!$product) continue;
        $programs[] = ptp_format_program($product);
    }

    // If no featured products, get latest products
    if (empty($programs)) {
        $args = [
            'post_type' => 'product',
            'post_status' => 'publish',
            'posts_per_page' => 6,
            'orderby' => 'date',
            'order' => 'DESC',
            'tax_query' => [
                [
                    'taxonomy' => 'product_cat',
                    'field' => 'slug',
                    'terms' => ['summer-camps', 'summer', 'camps', 'winter-clinics', 'clinics'],
                    'operator' => 'IN',
                ],
            ],
        ];

        $query = new WP_Query($args);
        foreach ($query->posts as $post) {
            $product = wc_get_product($post->ID);
            if (!$product) continue;
            $programs[] = ptp_format_program($product);
        }
    }

    return $programs;
}

/**
 * Format a WooCommerce product as a program for the mobile app
 */
function ptp_format_program($product, $full_details = false) {
    $id = $product->get_id();

    // Get product categories to determine type
    $categories = wp_get_post_terms($id, 'product_cat', ['fields' => 'slugs']);
    $type = 'camp'; // default
    if (array_intersect(['winter-clinics', 'clinics', 'clinic'], $categories)) {
        $type = 'clinic';
    }

    // Get main image
    $image_id = $product->get_image_id();
    $main_image = $image_id ? wp_get_attachment_url($image_id) : '';

    // Get gallery images
    $gallery_ids = $product->get_gallery_image_ids();
    $gallery_urls = array_map('wp_get_attachment_url', $gallery_ids);

    // Get custom meta fields
    $date = get_post_meta($id, '_camp_date', true) ?: get_post_meta($id, '_event_date', true);
    $end_date = get_post_meta($id, '_camp_end_date', true) ?: get_post_meta($id, '_event_end_date', true);
    $time = get_post_meta($id, '_camp_time', true) ?: get_post_meta($id, '_event_time', true);
    $time_start = get_post_meta($id, '_camp_time_start', true) ?: '09:00';
    $time_end = get_post_meta($id, '_camp_time_end', true) ?: '15:00';
    $location = get_post_meta($id, '_camp_location', true) ?: get_post_meta($id, '_event_location', true);
    $venue = get_post_meta($id, '_camp_venue', true);
    $address = get_post_meta($id, '_camp_address', true);
    $city = get_post_meta($id, '_camp_city', true);
    $state = get_post_meta($id, '_camp_state', true) ?: 'PA';
    $market_slug = get_post_meta($id, '_market_slug', true) ?: 'main-line';
    $age_bands = get_post_meta($id, '_age_bands', true);
    $min_age = get_post_meta($id, '_min_age', true);
    $max_age = get_post_meta($id, '_max_age', true);

    // Parse age bands if stored as string
    if (is_string($age_bands)) {
        $age_bands = array_map('trim', explode(',', $age_bands));
    }
    if (empty($age_bands)) {
        $age_bands = ['6-8', '9-11', '12-14']; // Default
    }

    // Stock status
    $stock_qty = $product->get_stock_quantity();
    $stock_status = $product->get_stock_status();
    $almost_full = $stock_qty !== null && $stock_qty <= 5 && $stock_qty > 0;

    // Price
    $price = (float) $product->get_price();
    $regular_price = (float) $product->get_regular_price();
    $sale_price = $product->get_sale_price() ? (float) $product->get_sale_price() : null;

    // Check if featured/bestseller
    $is_featured = $product->is_featured();

    $program = [
        'id' => $id,
        'title' => $product->get_name(),
        'type' => $type,
        'description' => $product->get_description(),
        'shortDescription' => $product->get_short_description(),
        'date' => $date,
        'endDate' => $end_date,
        'time' => $time ?: ($time_start . ' - ' . $time_end),
        'timeStart' => $time_start,
        'timeEnd' => $time_end,
        'location' => $location ?: ($city ? "$city, $state" : ''),
        'venue' => $venue,
        'address' => $address,
        'city' => $city,
        'state' => $state,
        'marketSlug' => $market_slug,
        'price' => $price,
        'regularPrice' => $regular_price,
        'salePrice' => $sale_price,
        'stock' => $stock_qty,
        'stockStatus' => $stock_status,
        'almostFull' => $almost_full,
        'bestseller' => $is_featured,
        'ageBands' => $age_bands,
        'minAge' => $min_age ? (int) $min_age : null,
        'maxAge' => $max_age ? (int) $max_age : null,
        'mainImageUrl' => $main_image,
        'galleryUrls' => $gallery_urls,
        'status' => 'upcoming',
        'wooProductId' => $id,
        'categorySlug' => !empty($categories) ? $categories[0] : '',
        'createdAt' => $product->get_date_created() ? $product->get_date_created()->format('c') : '',
        'updatedAt' => $product->get_date_modified() ? $product->get_date_modified()->format('c') : '',
    ];

    // Add extra details for single program view
    if ($full_details) {
        $what_to_bring = get_post_meta($id, '_what_to_bring', true);
        $schedule = get_post_meta($id, '_schedule', true);
        $highlights = get_post_meta($id, '_highlights', true);

        // Parse arrays if stored as strings
        if (is_string($what_to_bring)) {
            $what_to_bring = array_map('trim', explode("\n", $what_to_bring));
        }
        if (is_string($highlights)) {
            $highlights = array_map('trim', explode("\n", $highlights));
        }

        $program['whatToBring'] = $what_to_bring ?: ['Cleats', 'Shin guards', 'Water bottle'];
        $program['schedule'] = $schedule ?: [];
        $program['highlights'] = $highlights ?: [];
    }

    return $program;
}

/**
 * Get markets/locations
 */
function ptp_get_markets(WP_REST_Request $request) {
    // Try to get from custom taxonomy or options
    $markets = get_option('ptp_markets', []);

    if (empty($markets)) {
        // Default markets
        $markets = [
            ['slug' => 'main-line', 'name' => 'Main Line, PA', 'city' => 'Wayne', 'state' => 'PA', 'programCount' => 0],
            ['slug' => 'west-chester', 'name' => 'West Chester, PA', 'city' => 'West Chester', 'state' => 'PA', 'programCount' => 0],
            ['slug' => 'king-of-prussia', 'name' => 'King of Prussia, PA', 'city' => 'King of Prussia', 'state' => 'PA', 'programCount' => 0],
            ['slug' => 'short-hills', 'name' => 'Short Hills, NJ', 'city' => 'Short Hills', 'state' => 'NJ', 'programCount' => 0],
            ['slug' => 'princeton', 'name' => 'Princeton, NJ', 'city' => 'Princeton', 'state' => 'NJ', 'programCount' => 0],
        ];
    }

    // Count programs per market
    foreach ($markets as &$market) {
        $args = [
            'post_type' => 'product',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'fields' => 'ids',
            'meta_query' => [
                [
                    'key' => '_market_slug',
                    'value' => $market['slug'],
                    'compare' => '=',
                ],
            ],
        ];
        $query = new WP_Query($args);
        $market['programCount'] = $query->found_posts;
    }

    return $markets;
}

/**
 * Get trainers (from users with trainer role)
 */
function ptp_get_trainers(WP_REST_Request $request) {
    $page = $request->get_param('page') ?: 1;
    $per_page = $request->get_param('per_page') ?: 20;
    $location = $request->get_param('location');
    $specialization = $request->get_param('specialization');

    $args = [
        'role__in' => ['ptp_trainer', 'trainer'],
        'number' => $per_page,
        'paged' => $page,
        'meta_query' => [],
    ];

    if ($location) {
        $args['meta_query'][] = [
            'key' => 'trainer_location',
            'value' => $location,
            'compare' => 'LIKE',
        ];
    }

    if ($specialization) {
        $args['meta_query'][] = [
            'key' => 'trainer_specializations',
            'value' => $specialization,
            'compare' => 'LIKE',
        ];
    }

    $user_query = new WP_User_Query($args);
    $trainers = [];

    foreach ($user_query->get_results() as $user) {
        $trainers[] = ptp_format_trainer($user);
    }

    return [
        'trainers' => $trainers,
        'total' => $user_query->get_total(),
        'page' => (int) $page,
        'per_page' => (int) $per_page,
        'total_pages' => ceil($user_query->get_total() / $per_page),
    ];
}

/**
 * Get single trainer
 */
function ptp_get_trainer(WP_REST_Request $request) {
    $id = $request->get_param('id');
    $user = get_user_by('ID', $id);

    if (!$user) {
        return new WP_Error('not_found', 'Trainer not found', ['status' => 404]);
    }

    return ptp_format_trainer($user, true);
}

/**
 * Format a user as a trainer for the mobile app
 */
function ptp_format_trainer($user, $full_details = false) {
    $id = $user->ID;

    // Get user meta
    $first_name = get_user_meta($id, 'first_name', true);
    $last_name = get_user_meta($id, 'last_name', true);
    $phone = get_user_meta($id, 'phone', true) ?: get_user_meta($id, 'billing_phone', true);
    $bio = get_user_meta($id, 'description', true) ?: get_user_meta($id, 'trainer_bio', true);
    $avatar_url = get_avatar_url($id, ['size' => 400]);
    $headshot_url = get_user_meta($id, 'trainer_headshot', true) ?: $avatar_url;

    // Trainer specific meta
    $education = get_user_meta($id, 'trainer_education', true) ?: get_user_meta($id, 'college_pro', true);
    $hourly_rate = get_user_meta($id, 'trainer_hourly_rate', true) ?: 80;
    $location = get_user_meta($id, 'trainer_location', true);
    $specializations = get_user_meta($id, 'trainer_specializations', true);
    $teaching_style = get_user_meta($id, 'trainer_teaching_style', true);
    $rating = get_user_meta($id, 'trainer_rating', true) ?: 5.0;
    $total_reviews = get_user_meta($id, 'trainer_review_count', true) ?: 0;

    // Parse specializations
    if (is_string($specializations)) {
        $specializations = array_map('trim', explode(',', $specializations));
    }
    if (empty($specializations)) {
        $specializations = [];
    }

    $trainer = [
        'id' => $id,
        'email' => $user->user_email,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'phone' => $phone,
        'avatar_url' => $headshot_url,
        'bio' => $bio,
        'education' => $education,
        'hourly_rate' => (float) $hourly_rate,
        'location' => $location,
        'specializations' => $specializations,
        'teaching_style' => $teaching_style,
        'rating' => (float) $rating,
        'total_reviews' => (int) $total_reviews,
    ];

    // Add reviews for full details
    if ($full_details) {
        $trainer['reviews'] = ptp_get_trainer_reviews($id);
        $trainer['gallery'] = get_user_meta($id, 'trainer_gallery', true) ?: [];
    }

    return $trainer;
}

/**
 * Get trainer reviews
 */
function ptp_get_trainer_reviews($trainer_id) {
    // Get from comments or custom post type
    $args = [
        'post_type' => 'trainer_review',
        'posts_per_page' => 10,
        'meta_query' => [
            [
                'key' => '_trainer_id',
                'value' => $trainer_id,
                'compare' => '=',
            ],
        ],
    ];

    $query = new WP_Query($args);
    $reviews = [];

    foreach ($query->posts as $post) {
        $reviews[] = [
            'id' => $post->ID,
            'reviewer_name' => get_post_meta($post->ID, '_reviewer_name', true),
            'rating' => (int) get_post_meta($post->ID, '_rating', true),
            'comment' => $post->post_content,
            'date' => $post->post_date,
            'session_id' => get_post_meta($post->ID, '_session_id', true),
        ];
    }

    return $reviews;
}

/**
 * Add custom meta boxes for program/camp details
 */
add_action('add_meta_boxes', function() {
    add_meta_box(
        'ptp_camp_details',
        'PTP Camp/Clinic Details',
        'ptp_render_camp_meta_box',
        'product',
        'normal',
        'high'
    );
});

function ptp_render_camp_meta_box($post) {
    wp_nonce_field('ptp_camp_meta', 'ptp_camp_meta_nonce');

    $fields = [
        '_camp_date' => 'Start Date (YYYY-MM-DD)',
        '_camp_end_date' => 'End Date (YYYY-MM-DD)',
        '_camp_time' => 'Time Display (e.g., "9:00 AM - 3:00 PM")',
        '_camp_time_start' => 'Start Time (24h, e.g., "09:00")',
        '_camp_time_end' => 'End Time (24h, e.g., "15:00")',
        '_camp_location' => 'Full Location (e.g., "Haverford School, PA")',
        '_camp_venue' => 'Venue Name',
        '_camp_address' => 'Street Address',
        '_camp_city' => 'City',
        '_camp_state' => 'State (e.g., "PA")',
        '_market_slug' => 'Market Slug (e.g., "main-line")',
        '_age_bands' => 'Age Bands (comma-separated, e.g., "6-8, 9-11, 12-14")',
        '_min_age' => 'Minimum Age',
        '_max_age' => 'Maximum Age',
        '_what_to_bring' => 'What to Bring (one item per line)',
        '_highlights' => 'Highlights (one item per line)',
    ];

    echo '<table class="form-table">';
    foreach ($fields as $key => $label) {
        $value = get_post_meta($post->ID, $key, true);
        $type = 'text';
        $is_textarea = in_array($key, ['_what_to_bring', '_highlights']);

        echo '<tr>';
        echo '<th><label for="' . esc_attr($key) . '">' . esc_html($label) . '</label></th>';
        echo '<td>';
        if ($is_textarea) {
            echo '<textarea name="' . esc_attr($key) . '" id="' . esc_attr($key) . '" rows="4" class="large-text">' . esc_textarea($value) . '</textarea>';
        } else {
            echo '<input type="text" name="' . esc_attr($key) . '" id="' . esc_attr($key) . '" value="' . esc_attr($value) . '" class="regular-text">';
        }
        echo '</td>';
        echo '</tr>';
    }
    echo '</table>';
}

/**
 * Save camp meta
 */
add_action('save_post_product', function($post_id) {
    if (!isset($_POST['ptp_camp_meta_nonce']) || !wp_verify_nonce($_POST['ptp_camp_meta_nonce'], 'ptp_camp_meta')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    $fields = [
        '_camp_date', '_camp_end_date', '_camp_time', '_camp_time_start', '_camp_time_end',
        '_camp_location', '_camp_venue', '_camp_address', '_camp_city', '_camp_state',
        '_market_slug', '_age_bands', '_min_age', '_max_age', '_what_to_bring', '_highlights'
    ];

    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            update_post_meta($post_id, $field, sanitize_textarea_field($_POST[$field]));
        }
    }
});
