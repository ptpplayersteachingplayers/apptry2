/**
 * Blog Screen (Parent)
 *
 * Blog/content management featuring:
 * - Hero with description
 * - Search bar for articles
 * - Category filter tabs
 * - Article cards with featured images
 * - Trending articles sidebar
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { BlogPost, BlogCategory } from '../../types';
import { getBlogPosts, getTrendingPosts } from '../../api/content';
import {
  PTPText,
  PTPSearchInput,
  PTPHero,
  PTPListSkeleton,
  AnimatedPressable,
  FadeInView,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { featureImages } from '../../assets/media';
import { useHaptics, useDebounce } from '../../hooks';

type BlogScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

const CATEGORIES: { key: BlogCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'winter-camps', label: 'Winter Camps' },
  { key: 'summer-camps', label: 'Summer Camps' },
  { key: 'camp-guides', label: 'Camp Guides' },
  { key: 'drills', label: 'Drills' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'tips', label: 'Tips' },
];

/**
 * BlogScreen - Blog and content discovery
 */
const BlogScreen: React.FC = () => {
  const navigation = useNavigation<BlogScreenNavigationProp>();
  const { selection } = useHaptics();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setPage(1);
    loadPosts(true);
  }, [selectedCategory, debouncedSearch]);

  const loadInitialData = async () => {
    try {
      const [postsResponse, trending] = await Promise.all([
        getBlogPosts('all', 1, 10),
        getTrendingPosts(5),
      ]);
      setPosts(postsResponse.posts);
      setHasMore(postsResponse.hasMore);
      setTrendingPosts(trending);
    } catch (err) {
      console.error('Error loading blog data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const response = await getBlogPosts(
        selectedCategory,
        currentPage,
        10,
        debouncedSearch || undefined
      );

      if (reset) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }
      setHasMore(response.hasMore);
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPosts(true);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    setPage(prev => prev + 1);
    loadPosts();
  };

  const handleCategoryChange = (category: BlogCategory) => {
    selection();
    setSelectedCategory(category);
  };

  const handlePostPress = (post: BlogPost) => {
    selection();
    navigation.navigate('BlogPost' as any, { slug: post.slug });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderPostCard = ({ item }: { item: BlogPost }) => (
    <FadeInView>
      <AnimatedPressable
        style={styles.postCard}
        onPress={() => handlePostPress(item)}
      >
        <Image
          source={{ uri: item.featuredImage }}
          style={styles.postImage}
          resizeMode="cover"
        />
        <View style={styles.postContent}>
          <View style={styles.postMeta}>
            <View style={styles.categoryBadge}>
              <PTPText variant="caption" color="primary" style={styles.categoryText}>
                {item.category.toUpperCase().replace('-', ' ')}
              </PTPText>
            </View>
            <PTPText variant="caption" color="gray500">
              {item.readTime} min read
            </PTPText>
          </View>
          <PTPText variant="sectionTitle" numberOfLines={2} style={styles.postTitle}>
            {item.title}
          </PTPText>
          <PTPText variant="body" color="gray400" numberOfLines={2} style={styles.postExcerpt}>
            {item.excerpt}
          </PTPText>
          <View style={styles.postFooter}>
            <View style={styles.authorInfo}>
              {item.author.avatar && (
                <Image
                  source={{ uri: item.author.avatar }}
                  style={styles.authorAvatar}
                />
              )}
              <PTPText variant="caption" color="gray500">
                {item.author.name}
              </PTPText>
            </View>
            <PTPText variant="caption" color="gray600">
              {formatDate(item.publishedAt)}
            </PTPText>
          </View>
        </View>
      </AnimatedPressable>
    </FadeInView>
  );

  const ListHeader = () => (
    <View>
      {/* Hero */}
      <PTPHero
        imageUrl={featureImages.blogHero || featureImages.homeHero}
        height={200}
      >
        <View style={styles.heroContent}>
          <PTPText variant="heroTitle" color="white">
            INSIDE PTP
          </PTPText>
          <PTPText variant="heroSubtitle" color="gray300">
            Tips, guides, and stories from our community
          </PTPText>
        </View>
      </PTPHero>

      {/* Search */}
      <View style={styles.searchSection}>
        <PTPSearchInput
          placeholder="Search articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              selectedCategory === cat.key && styles.categoryTabActive,
            ]}
            onPress={() => handleCategoryChange(cat.key)}
          >
            <PTPText
              variant="label"
              color={selectedCategory === cat.key ? 'inkBlack' : 'gray400'}
            >
              {cat.label}
            </PTPText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending Section */}
      {trendingPosts.length > 0 && selectedCategory === 'all' && !searchQuery && (
        <View style={styles.trendingSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={18} color={colors.primary} />
            <PTPText variant="sectionTitle">TRENDING</PTPText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScroll}
          >
            {trendingPosts.map((post) => (
              <AnimatedPressable
                key={post.id}
                style={styles.trendingCard}
                onPress={() => handlePostPress(post)}
              >
                <Image
                  source={{ uri: post.featuredImage }}
                  style={styles.trendingImage}
                  resizeMode="cover"
                />
                <View style={styles.trendingOverlay} />
                <View style={styles.trendingContent}>
                  <PTPText variant="caption" color="primary">
                    {post.category.toUpperCase()}
                  </PTPText>
                  <PTPText variant="body" color="white" numberOfLines={2}>
                    {post.title}
                  </PTPText>
                </View>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* All Articles Header */}
      <View style={styles.articlesHeader}>
        <PTPText variant="sectionTitle">
          {selectedCategory === 'all' ? 'ALL ARTICLES' : selectedCategory.toUpperCase().replace('-', ' ')}
        </PTPText>
        <PTPText variant="caption" color="gray500">
          {posts.length} article{posts.length !== 1 ? 's' : ''}
        </PTPText>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ListHeader />
        <View style={styles.loadingContainer}>
          <PTPListSkeleton count={3} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPostCard}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color={colors.gray600} />
            <PTPText variant="body" color="gray500" center style={styles.emptyText}>
              No articles found. Try a different search or category.
            </PTPText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: spacing[6],
  },
  searchSection: {
    padding: spacing[4],
  },
  categoryScroll: {
    marginBottom: spacing[4],
  },
  categoryContainer: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  categoryTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  trendingSection: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  trendingScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  trendingCard: {
    width: 200,
    height: 150,
    overflow: 'hidden',
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  trendingContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[3],
  },
  articlesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  listContent: {
    paddingBottom: spacing[8],
  },
  loadingContainer: {
    padding: spacing[4],
  },
  postCard: {
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.gray800,
  },
  postContent: {
    padding: spacing[4],
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  categoryBadge: {
    backgroundColor: 'rgba(252, 185, 0, 0.1)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  postTitle: {
    marginBottom: spacing[2],
  },
  postExcerpt: {
    marginBottom: spacing[3],
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  emptyContainer: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing[4],
  },
});

export default BlogScreen;
