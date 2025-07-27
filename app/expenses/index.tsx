// app/expenses/index.tsx
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTransactions } from '../context/TransactionContext';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'income' | 'expense';
type SortType = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function ExpensesScreen() {
  const router = useRouter();
  const { transactions, deleteTransaction } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const filterAnimation = useRef(new Animated.Value(0)).current;
  const [isScrolling, setIsScrolling] = useState(false);

  // Filtered and sorted transactions
  const processedTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'highest':
          return b.amount - a.amount;
        case 'lowest':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, searchQuery, filterType, sortType]);

  // Analytics data
  const analytics = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Category breakdown
    const categoryStats = transactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { income: 0, expense: 0 };
      }
      acc[t.category][t.type] += t.amount;
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length,
      categoryStats
    };
  }, [transactions]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    Animated.timing(filterAnimation, {
      toValue: showFilters ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTransaction(id)
        }
      ]
    );
  };

  const handleScrollBeginDrag = () => {
    setIsScrolling(true);
  };

  const handleScrollEndDrag = () => {
    setIsScrolling(false);
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'Food': '🍔', 'Transport': '🚗', 'Shopping': '🛒', 'Housing': '🏠',
      'Utilities': '⚡', 'Entertainment': '🎯', 'Healthcare': '🏥', 'Education': '📚',
      'Clothing': '👕', 'Salary': '💰', 'Freelance': '💼', 'Investment': '📈',
      'Gift': '🎁', 'Bonus': '💸', 'Business': '🏪', 'Rental': '🏠', 'Other': '💡'
    };
    return emojiMap[category] || '💡';
  };

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        filterType === type && styles.activeFilterChip
      ]}
      onPress={() => setFilterType(type)}
    >
      <Text style={[
        styles.filterChipText,
        filterType === type && styles.activeFilterChipText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const SortButton = ({ type, label }: { type: SortType; label: string }) => (
    <TouchableOpacity
      style={[
        styles.sortChip,
        sortType === type && styles.activeSortChip
      ]}
      onPress={() => setSortType(type)}
    >
      <Text style={[
        styles.sortChipText,
        sortType === type && styles.activeSortChipText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item, index }: { item: any, index: number }) => {
    // Only apply scroll animations when actually scrolling
    const inputRange = [-1, 0, 50 * index, 50 * (index + 2)];
    
    const scale = isScrolling ? scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.8],
      extrapolateLeft: 'clamp',
    }) : new Animated.Value(1);

    const opacity = isScrolling ? scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.3],
      extrapolateLeft: 'clamp',
    }) : new Animated.Value(1);

    return (
      <Animated.View style={[
        styles.card, 
        isScrolling && { 
          transform: [{ scale }],
          opacity: opacity
        }
      ]}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryContainer}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: item.type === 'income' ? '#DCFCE7' : '#FEE2E2' }
            ]}>
              <Text style={styles.categoryEmoji}>
                {getCategoryEmoji(item.category)}
              </Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>{item.title}</Text>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={[
              styles.amount,
              { color: item.type === 'income' ? '#10B981' : '#EF4444' }
            ]}>
              {item.type === 'income' ? '+' : '-'}₨{item.amount.toLocaleString()}
            </Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[
            styles.typeChip,
            { backgroundColor: item.type === 'income' ? '#DCFCE7' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.typeText,
              { color: item.type === 'income' ? '#059669' : '#DC2626' }
            ]}>
              {item.type === 'income' ? '↗ Income' : '↙ Expense'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Text style={styles.deleteButtonText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const ListHeader = () => (
    <View>
      {/* Quick Action Buttons */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.savingsButton}
          onPress={() => router.push('/savings')} // Adjust the route as needed
          activeOpacity={0.8}
        >
          <View style={styles.savingsButtonContent}>
            <View style={styles.savingsIconContainer}>
              <Text style={styles.savingsIcon}>🎯</Text>
            </View>
            <View style={styles.savingsTextContainer}>
              <Text style={styles.savingsTitle}>Savings Goals</Text>
              <Text style={styles.savingsSubtitle}>Track your progress</Text>
            </View>
          </View>
          <Text style={styles.savingsArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Analytics Summary */}
      <View style={styles.analyticsContainer}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsLabel}>Total Balance</Text>
          <Text style={[
            styles.analyticsAmount,
            { color: analytics.balance >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            ₨{analytics.balance.toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.analyticsRow}>
          <View style={[styles.analyticsCard, styles.incomeCard]}>
            <Text style={styles.analyticsLabel}>Income</Text>
            <Text style={styles.incomeText}>₨{analytics.totalIncome.toLocaleString()}</Text>
          </View>
          <View style={[styles.analyticsCard, styles.expenseCard]}>
            <Text style={styles.analyticsLabel}>Expenses</Text>
            <Text style={styles.expenseText}>₨{analytics.totalExpense.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Filters */}
      <Animated.View
        style={[
          styles.filtersContainer,
          {
            height: filterAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 140],
            }),
            opacity: filterAnimation,
          }
        ]}
      >
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Filter by Type</Text>
          <View style={styles.filterRow}>
            <FilterButton type="all" label="All" />
            <FilterButton type="income" label="Income" />
            <FilterButton type="expense" label="Expense" />
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Sort by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              <SortButton type="newest" label="Newest" />
              <SortButton type="oldest" label="Oldest" />
              <SortButton type="highest" label="Highest" />
              <SortButton type="lowest" label="Lowest" />
            </View>
          </ScrollView>
        </View>
      </Animated.View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {searchQuery ? `Search Results (${processedTransactions.length})` : 'All Transactions'}
        </Text>
        <Text style={styles.resultsCount}>
          {processedTransactions.length} of {analytics.transactionCount}
        </Text>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {searchQuery ? '🔍' : '📊'}
      </Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Results Found' : 'No Transactions Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? `No transactions match "${searchQuery}"`
          : 'Start tracking your finances by adding your first transaction'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => router.push('/expenses/add')}
        >
          <Text style={styles.emptyButtonText}>Add Transaction</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>All Transactions</Text>
          <Text style={styles.subtitle}>
            {analytics.transactionCount} transaction{analytics.transactionCount !== 1 ? 's' : ''} total
          </Text>
        </View>
      </View>

      <FlatList
        data={processedTransactions}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleScrollEndDrag}
        scrollEventThrottle={16}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/expenses/add')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  
  // NEW: Quick Actions Container and Savings Button Styles
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  savingsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  savingsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  savingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  savingsIcon: {
    fontSize: 20,
  },
  savingsTextContainer: {
    flex: 1,
  },
  savingsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  savingsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  savingsArrow: {
    fontSize: 20,
    color: '#6366F1',
    fontWeight: '600',
  },

  analyticsContainer: {
    padding: 20,
    gap: 16,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  incomeCard: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  expenseCard: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  analyticsAmount: {
    fontSize: 28,
    fontWeight: '800',
  },
  incomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  expenseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  clearIcon: {
    fontSize: 16,
    color: '#9CA3AF',
    padding: 4,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 16,
  },
  filtersContainer: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  filterSection: {
    padding: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  activeSortChip: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeSortChipText: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});