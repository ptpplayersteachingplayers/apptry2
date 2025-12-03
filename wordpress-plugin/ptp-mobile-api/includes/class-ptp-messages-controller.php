<?php
/**
 * Messages Controller
 *
 * Handles messaging endpoints for the PTP Mobile API.
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PTP_Messages_Controller class
 */
class PTP_Messages_Controller {

    /**
     * REST namespace
     */
    private $namespace = 'ptp/v1';

    /**
     * Register routes
     */
    public function register_routes() {
        // Get conversations
        register_rest_route($this->namespace, '/messages/conversations', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_conversations'),
            'permission_callback' => array($this, 'check_auth'),
        ));

        // Get single conversation
        register_rest_route($this->namespace, '/messages/conversations/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_conversation'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
            ),
        ));

        // Get messages in a conversation
        register_rest_route($this->namespace, '/messages/conversations/(?P<id>\d+)/messages', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_messages'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
                'before' => array(
                    'type' => 'integer',
                    'description' => 'Get messages before this message ID',
                ),
                'limit' => array(
                    'type' => 'integer',
                    'default' => 50,
                ),
            ),
        ));

        // Send message
        register_rest_route($this->namespace, '/messages/send', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'send_message'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'conversation_id' => array(
                    'type' => 'integer',
                ),
                'recipient_id' => array(
                    'type' => 'integer',
                ),
                'content' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'attachments' => array(
                    'type' => 'array',
                ),
            ),
        ));

        // Start new conversation
        register_rest_route($this->namespace, '/messages/conversations/start', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'start_conversation'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'participant_id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
                'related_session_id' => array(
                    'type' => 'integer',
                ),
                'related_program_id' => array(
                    'type' => 'integer',
                ),
                'initial_message' => array(
                    'type' => 'string',
                ),
            ),
        ));

        // Mark messages as read
        register_rest_route($this->namespace, '/messages/conversations/(?P<id>\d+)/read', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'mark_as_read'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
            ),
        ));

        // Get unread count
        register_rest_route($this->namespace, '/messages/unread-count', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_unread_count'),
            'permission_callback' => array($this, 'check_auth'),
        ));

        // Delete conversation
        register_rest_route($this->namespace, '/messages/conversations/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::DELETABLE,
            'callback' => array($this, 'delete_conversation'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'id' => array(
                    'required' => true,
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
     * Get conversations
     */
    public function get_conversations($request) {
        global $wpdb;
        $user = wp_get_current_user();

        $table_conversations = $wpdb->prefix . 'ptp_conversations';
        $table_messages = $wpdb->prefix . 'ptp_messages';

        // Get conversations where user is a participant
        $conversations = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT c.*,
                        (SELECT content FROM $table_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                        (SELECT created_at FROM $table_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
                        (SELECT COUNT(*) FROM $table_messages WHERE conversation_id = c.id AND sender_id != %d AND read_at IS NULL) as unread_count
                 FROM $table_conversations c
                 WHERE c.participant_ids LIKE %s
                 AND c.status = 'active'
                 ORDER BY c.updated_at DESC",
                $user->ID,
                '%"' . $user->ID . '"%'
            ),
            ARRAY_A
        );

        $data = array_map(function($conv) use ($user) {
            return $this->format_conversation($conv, $user->ID);
        }, $conversations ?: array());

        return rest_ensure_response(array(
            'conversations' => $data,
        ));
    }

    /**
     * Get single conversation
     */
    public function get_conversation($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $id = (int) $request->get_param('id');

        $table_name = $wpdb->prefix . 'ptp_conversations';

        $conversation = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id),
            ARRAY_A
        );

        if (!$conversation) {
            return new WP_Error(
                'conversation_not_found',
                'Conversation not found',
                array('status' => 404)
            );
        }

        // Check permission
        $participants = json_decode($conversation['participant_ids'], true);
        if (!in_array($user->ID, $participants)) {
            return new WP_Error(
                'forbidden',
                'You do not have access to this conversation',
                array('status' => 403)
            );
        }

        return rest_ensure_response($this->format_conversation($conversation, $user->ID, true));
    }

    /**
     * Get messages in conversation
     */
    public function get_messages($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $conversation_id = (int) $request->get_param('id');
        $before = $request->get_param('before');
        $limit = (int) $request->get_param('limit');

        // Verify conversation access
        $table_conversations = $wpdb->prefix . 'ptp_conversations';
        $conversation = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_conversations WHERE id = %d", $conversation_id),
            ARRAY_A
        );

        if (!$conversation) {
            return new WP_Error(
                'conversation_not_found',
                'Conversation not found',
                array('status' => 404)
            );
        }

        $participants = json_decode($conversation['participant_ids'], true);
        if (!in_array($user->ID, $participants)) {
            return new WP_Error(
                'forbidden',
                'You do not have access to this conversation',
                array('status' => 403)
            );
        }

        // Get messages
        $table_messages = $wpdb->prefix . 'ptp_messages';

        $query = "SELECT * FROM $table_messages WHERE conversation_id = %d";
        $params = array($conversation_id);

        if ($before) {
            $query .= " AND id < %d";
            $params[] = $before;
        }

        $query .= " ORDER BY created_at DESC LIMIT %d";
        $params[] = $limit;

        $messages = $wpdb->get_results(
            $wpdb->prepare($query, $params),
            ARRAY_A
        );

        // Reverse to get chronological order
        $messages = array_reverse($messages);

        $data = array_map(array($this, 'format_message'), $messages);

        return rest_ensure_response(array(
            'messages' => $data,
            'has_more' => count($messages) === $limit,
        ));
    }

    /**
     * Send message
     */
    public function send_message($request) {
        global $wpdb;
        $user = wp_get_current_user();

        $conversation_id = $request->get_param('conversation_id');
        $recipient_id = $request->get_param('recipient_id');
        $content = sanitize_textarea_field($request->get_param('content'));
        $attachments = $request->get_param('attachments');

        // Get or create conversation
        if ($conversation_id) {
            // Verify access
            $table_conversations = $wpdb->prefix . 'ptp_conversations';
            $conversation = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM $table_conversations WHERE id = %d", $conversation_id),
                ARRAY_A
            );

            if (!$conversation) {
                return new WP_Error(
                    'conversation_not_found',
                    'Conversation not found',
                    array('status' => 404)
                );
            }

            $participants = json_decode($conversation['participant_ids'], true);
            if (!in_array($user->ID, $participants)) {
                return new WP_Error(
                    'forbidden',
                    'You do not have access to this conversation',
                    array('status' => 403)
                );
            }
        } elseif ($recipient_id) {
            // Find existing or create new conversation
            $conversation_id = $this->find_or_create_conversation($user->ID, $recipient_id);
        } else {
            return new WP_Error(
                'missing_recipient',
                'Either conversation_id or recipient_id is required',
                array('status' => 400)
            );
        }

        // Insert message
        $table_messages = $wpdb->prefix . 'ptp_messages';

        $is_trainer = in_array('ptp_trainer', $user->roles);

        $wpdb->insert(
            $table_messages,
            array(
                'conversation_id' => $conversation_id,
                'sender_id' => $user->ID,
                'sender_type' => $is_trainer ? 'trainer' : 'parent',
                'content' => $content,
                'attachment_urls' => $attachments ? json_encode($attachments) : null,
                'status' => 'sent',
            ),
            array('%d', '%d', '%s', '%s', '%s', '%s')
        );

        $message_id = $wpdb->insert_id;

        // Update conversation timestamp
        $table_conversations = $wpdb->prefix . 'ptp_conversations';
        $wpdb->update(
            $table_conversations,
            array('updated_at' => current_time('mysql')),
            array('id' => $conversation_id),
            array('%s'),
            array('%d')
        );

        // Notify recipient
        $this->notify_new_message($conversation_id, $user->ID, $content);

        // Get the created message
        $message = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_messages WHERE id = %d", $message_id),
            ARRAY_A
        );

        return rest_ensure_response(array(
            'success' => true,
            'message' => $this->format_message($message),
        ));
    }

    /**
     * Start new conversation
     */
    public function start_conversation($request) {
        global $wpdb;
        $user = wp_get_current_user();

        $participant_id = (int) $request->get_param('participant_id');
        $related_session_id = $request->get_param('related_session_id');
        $related_program_id = $request->get_param('related_program_id');
        $initial_message = sanitize_textarea_field($request->get_param('initial_message'));

        // Check if participant exists
        $participant = get_user_by('ID', $participant_id);
        if (!$participant) {
            return new WP_Error(
                'user_not_found',
                'Participant not found',
                array('status' => 404)
            );
        }

        // Find existing conversation
        $conversation_id = $this->find_or_create_conversation(
            $user->ID,
            $participant_id,
            $related_session_id,
            $related_program_id
        );

        // Send initial message if provided
        if ($initial_message) {
            $table_messages = $wpdb->prefix . 'ptp_messages';
            $is_trainer = in_array('ptp_trainer', $user->roles);

            $wpdb->insert(
                $table_messages,
                array(
                    'conversation_id' => $conversation_id,
                    'sender_id' => $user->ID,
                    'sender_type' => $is_trainer ? 'trainer' : 'parent',
                    'content' => $initial_message,
                    'status' => 'sent',
                ),
                array('%d', '%d', '%s', '%s', '%s')
            );

            $this->notify_new_message($conversation_id, $user->ID, $initial_message);
        }

        // Get conversation
        $table_conversations = $wpdb->prefix . 'ptp_conversations';
        $conversation = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_conversations WHERE id = %d", $conversation_id),
            ARRAY_A
        );

        return rest_ensure_response(array(
            'success' => true,
            'conversation' => $this->format_conversation($conversation, $user->ID),
        ));
    }

    /**
     * Mark messages as read
     */
    public function mark_as_read($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $conversation_id = (int) $request->get_param('id');

        // Verify access
        $table_conversations = $wpdb->prefix . 'ptp_conversations';
        $conversation = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_conversations WHERE id = %d", $conversation_id),
            ARRAY_A
        );

        if (!$conversation) {
            return new WP_Error(
                'conversation_not_found',
                'Conversation not found',
                array('status' => 404)
            );
        }

        $participants = json_decode($conversation['participant_ids'], true);
        if (!in_array($user->ID, $participants)) {
            return new WP_Error(
                'forbidden',
                'You do not have access to this conversation',
                array('status' => 403)
            );
        }

        // Mark all messages from other users as read
        $table_messages = $wpdb->prefix . 'ptp_messages';
        $wpdb->query(
            $wpdb->prepare(
                "UPDATE $table_messages SET read_at = %s, status = 'read'
                 WHERE conversation_id = %d AND sender_id != %d AND read_at IS NULL",
                current_time('mysql'),
                $conversation_id,
                $user->ID
            )
        );

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Messages marked as read',
        ));
    }

    /**
     * Get unread count
     */
    public function get_unread_count($request) {
        global $wpdb;
        $user = wp_get_current_user();

        $table_conversations = $wpdb->prefix . 'ptp_conversations';
        $table_messages = $wpdb->prefix . 'ptp_messages';

        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM $table_messages m
                 JOIN $table_conversations c ON m.conversation_id = c.id
                 WHERE c.participant_ids LIKE %s
                 AND m.sender_id != %d
                 AND m.read_at IS NULL",
                '%"' . $user->ID . '"%',
                $user->ID
            )
        );

        return rest_ensure_response(array(
            'unread_count' => (int) $count,
        ));
    }

    /**
     * Delete conversation
     */
    public function delete_conversation($request) {
        global $wpdb;
        $user = wp_get_current_user();
        $id = (int) $request->get_param('id');

        $table_conversations = $wpdb->prefix . 'ptp_conversations';

        // Verify access
        $conversation = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_conversations WHERE id = %d", $id),
            ARRAY_A
        );

        if (!$conversation) {
            return new WP_Error(
                'conversation_not_found',
                'Conversation not found',
                array('status' => 404)
            );
        }

        $participants = json_decode($conversation['participant_ids'], true);
        if (!in_array($user->ID, $participants)) {
            return new WP_Error(
                'forbidden',
                'You do not have access to this conversation',
                array('status' => 403)
            );
        }

        // Soft delete - set status to archived
        $wpdb->update(
            $table_conversations,
            array('status' => 'archived'),
            array('id' => $id),
            array('%s'),
            array('%d')
        );

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Conversation deleted',
        ));
    }

    /**
     * Find or create conversation
     */
    private function find_or_create_conversation($user_id, $participant_id, $session_id = null, $program_id = null) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'ptp_conversations';

        // Try to find existing conversation
        $participants = json_encode(array($user_id, $participant_id));
        $participants_reversed = json_encode(array($participant_id, $user_id));

        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM $table_name
                 WHERE (participant_ids = %s OR participant_ids = %s)
                 AND status = 'active'",
                $participants,
                $participants_reversed
            )
        );

        if ($existing) {
            return (int) $existing;
        }

        // Create new conversation
        $wpdb->insert(
            $table_name,
            array(
                'participant_ids' => $participants,
                'related_session_id' => $session_id,
                'related_program_id' => $program_id,
                'status' => 'active',
            ),
            array('%s', '%d', '%d', '%s')
        );

        return $wpdb->insert_id;
    }

    /**
     * Format conversation for API response
     */
    private function format_conversation($conversation, $current_user_id, $include_messages = false) {
        $participants = json_decode($conversation['participant_ids'], true);

        // Get other participant info
        $other_participant_id = null;
        foreach ($participants as $pid) {
            if ($pid != $current_user_id) {
                $other_participant_id = $pid;
                break;
            }
        }

        $other_user = get_user_by('ID', $other_participant_id);

        $data = array(
            'id' => (int) $conversation['id'],
            'participant' => $other_user ? array(
                'id' => $other_user->ID,
                'name' => $other_user->display_name,
                'avatar_url' => get_user_meta($other_user->ID, 'avatar_url', true) ?: get_avatar_url($other_user->ID),
                'role' => in_array('ptp_trainer', $other_user->roles) ? 'trainer' : 'parent',
            ) : null,
            'last_message' => isset($conversation['last_message']) ? $conversation['last_message'] : null,
            'last_message_at' => isset($conversation['last_message_at']) ? $conversation['last_message_at'] : $conversation['updated_at'],
            'unread_count' => isset($conversation['unread_count']) ? (int) $conversation['unread_count'] : 0,
            'related_session_id' => $conversation['related_session_id'] ? (int) $conversation['related_session_id'] : null,
            'related_program_id' => $conversation['related_program_id'] ? (int) $conversation['related_program_id'] : null,
            'created_at' => $conversation['created_at'],
            'updated_at' => $conversation['updated_at'],
        );

        if ($include_messages) {
            global $wpdb;
            $table_messages = $wpdb->prefix . 'ptp_messages';

            $messages = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM $table_messages WHERE conversation_id = %d ORDER BY created_at DESC LIMIT 50",
                    $conversation['id']
                ),
                ARRAY_A
            );

            $data['messages'] = array_map(array($this, 'format_message'), array_reverse($messages));
        }

        return $data;
    }

    /**
     * Format message for API response
     */
    private function format_message($message) {
        $sender = get_user_by('ID', $message['sender_id']);

        return array(
            'id' => (int) $message['id'],
            'conversation_id' => (int) $message['conversation_id'],
            'sender' => $sender ? array(
                'id' => $sender->ID,
                'name' => $sender->display_name,
                'avatar_url' => get_user_meta($sender->ID, 'avatar_url', true) ?: get_avatar_url($sender->ID),
            ) : null,
            'sender_type' => $message['sender_type'],
            'content' => $message['content'],
            'attachments' => $message['attachment_urls'] ? json_decode($message['attachment_urls'], true) : array(),
            'status' => $message['status'],
            'read_at' => $message['read_at'],
            'created_at' => $message['created_at'],
        );
    }

    /**
     * Notify recipient of new message
     */
    private function notify_new_message($conversation_id, $sender_id, $content) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'ptp_conversations';

        $conversation = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $conversation_id),
            ARRAY_A
        );

        if (!$conversation) return;

        $participants = json_decode($conversation['participant_ids'], true);

        foreach ($participants as $participant_id) {
            if ($participant_id == $sender_id) continue;

            $push_token = get_user_meta($participant_id, 'push_token', true);
            if ($push_token) {
                $sender = get_user_by('ID', $sender_id);

                do_action('ptp_send_push_notification', $push_token, array(
                    'title' => 'New Message',
                    'body' => $sender ? $sender->display_name . ': ' . wp_trim_words($content, 10) : $content,
                    'data' => array(
                        'type' => 'new_message',
                        'conversation_id' => $conversation_id,
                    ),
                ));
            }
        }
    }
}
