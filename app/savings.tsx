import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

interface SavingsContextType {
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: SavingsGoal) => void;
  updateSavingsGoal: (id: string, amount: number) => void;
  deleteSavingsGoal: (id: string) => void;
  isLoading: boolean;
}

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

const STORAGE_KEY = '@savings_goals';

export const SavingsProvider = ({ children }: { children: ReactNode }) => {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from AsyncStorage on app start
  useEffect(() => {
    loadSavingsGoals();
  }, []);

  // Save to AsyncStorage whenever savingsGoals changes
  useEffect(() => {
    if (!isLoading) {
      saveSavingsGoals(savingsGoals);
    }
  }, [savingsGoals, isLoading]);

  const loadSavingsGoals = async () => {
    try {
      const storedGoals = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedGoals) {
        const parsedGoals = JSON.parse(storedGoals);
        setSavingsGoals(parsedGoals);
      }
    } catch (error) {
      console.error('Error loading savings goals:', error);
      Alert.alert('Error', 'Failed to load savings goals from storage');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSavingsGoals = async (goals: SavingsGoal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving savings goals:', error);
      Alert.alert('Error', 'Failed to save savings goals to storage');
    }
  };

  const addSavingsGoal = (goal: SavingsGoal) => {
    setSavingsGoals(prev => [goal, ...prev]);
  };

  const updateSavingsGoal = (id: string, amount: number) => {
    setSavingsGoals(prev => 
      prev.map(goal => 
        goal.id === id 
          ? { ...goal, currentAmount: Math.min(goal.targetAmount, goal.currentAmount + amount) }
          : goal
      )
    );
  };

  const deleteSavingsGoal = (id: string) => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this savings goal?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => setSavingsGoals(prev => prev.filter(goal => goal.id !== id))
        }
      ]
    );
  };

  // Clear all data function (optional - for testing or reset)
  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSavingsGoals([]);
      Alert.alert('Success', 'All savings goals cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  return (
    <SavingsContext.Provider value={{ 
      savingsGoals,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      isLoading
    }}>
      {children}
    </SavingsContext.Provider>
  );
};

export const useSavings = () => {
  const context = useContext(SavingsContext);
  if (!context) throw new Error('useSavings must be used within a SavingsProvider');
  return context;
};

const AddSavingsGoalForm = () => {
  const { addSavingsGoal } = useSavings();
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    category: ''
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.targetAmount || !formData.deadline || !formData.category) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (parseFloat(formData.targetAmount) <= 0) {
      Alert.alert('Error', 'Target amount must be greater than 0');
      return;
    }

    addSavingsGoal({
      id: Date.now().toString(),
      title: formData.title,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      deadline: formData.deadline,
      category: formData.category
    });

    setFormData({
      title: '',
      targetAmount: '',
      deadline: '',
      category: ''
    });

    Alert.alert('Success', 'Savings goal created and saved successfully!');
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Ionicons name="target" size={20} color="#10B981" />
        <Text style={styles.formTitle}>Add Savings Goal</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Goal title (e.g., Emergency Fund)"
          value={formData.title}
          onChangeText={(text) => setFormData({...formData, title: text})}
          placeholderTextColor="#9CA3AF"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Target amount"
          value={formData.targetAmount}
          onChangeText={(text) => setFormData({...formData, targetAmount: text})}
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Category (e.g., Emergency, Vacation)"
          value={formData.category}
          onChangeText={(text) => setFormData({...formData, category: text})}
          placeholderTextColor="#9CA3AF"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Target date (YYYY-MM-DD)"
          value={formData.deadline}
          onChangeText={(text) => setFormData({...formData, deadline: text})}
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Create Savings Goal</Text>
      </TouchableOpacity>
    </View>
  );
};

const SavingsGoalCard = ({ goal }: { goal: SavingsGoal }) => {
  const { updateSavingsGoal, deleteSavingsGoal } = useSavings();
  const [addAmount, setAddAmount] = useState('');

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  const handleAddMoney = () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    updateSavingsGoal(goal.id, parseFloat(addAmount));
    setAddAmount('');
    Alert.alert('Success', 'Amount added and saved successfully!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const timeDiff = deadline.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <View style={[styles.goalCard, { borderLeftColor: isCompleted ? '#10B981' : '#3B82F6' }]}>
      <View style={styles.goalHeader}>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalCategory}>{goal.category}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteSavingsGoal(goal.id)}>
          <Ionicons name="trash" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercentage}>{progress.toFixed(1)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: isCompleted ? '#10B981' : '#3B82F6'
              }
            ]}
          />
        </View>
      </View>

      <View style={styles.amountSection}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Current</Text>
          <Text style={styles.currentAmount}>${goal.currentAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Target</Text>
          <Text style={styles.targetAmount}>${goal.targetAmount.toFixed(2)}</Text>
        </View>
      </View>

      {!isCompleted && (
        <View style={styles.remainingSection}>
          <Text style={styles.remainingText}>
            <Text style={styles.remainingAmount}>${remaining.toFixed(2)}</Text> remaining
          </Text>
          <View style={styles.deadlineContainer}>
            <Ionicons name="calendar" size={14} color="#6B7280" />
            <Text style={styles.deadlineText}>
              Due: {formatDate(goal.deadline)} 
              <Text style={[styles.daysRemaining, { color: daysRemaining < 30 ? '#EF4444' : '#6B7280' }]}>
                {' '}({daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'})
              </Text>
            </Text>
          </View>
        </View>
      )}

      {isCompleted && (
        <View style={styles.completedSection}>
          <View style={styles.completedContainer}>
            <Ionicons name="trending-up" size={16} color="#059669" />
            <Text style={styles.completedText}>Goal Completed! 🎉</Text>
          </View>
        </View>
      )}

      {!isCompleted && (
        <View style={styles.addMoneySection}>
          <TextInput
            style={styles.addMoneyInput}
            placeholder="Add amount"
            value={addAmount}
            onChangeText={setAddAmount}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddMoney}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const SavingsGoalsList = () => {
  const { savingsGoals, isLoading } = useSavings();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your savings goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.goalsListContainer}>
      <View style={styles.goalsListHeader}>
        <Ionicons name="target" size={24} color="#374151" />
        <Text style={styles.goalsListTitle}>Savings Goals</Text>
        <View style={styles.savedIndicator}>
          <Ionicons name="cloud-done" size={16} color="#10B981" />
          <Text style={styles.savedText}>Auto-saved</Text>
        </View>
      </View>
      
      {savingsGoals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="target" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>
            No savings goals yet. Create your first goal to start saving!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.goalsList} showsVerticalScrollIndicator={false}>
          {savingsGoals.map(goal => (
            <SavingsGoalCard key={goal.id} goal={goal} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default function SavingsGoalsScreen() {
  return (
    <SavingsProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Ionicons name="wallet" size={32} color="#374151" />
            <Text style={styles.headerTitle}>Savings Goals</Text>
            <Text style={styles.headerSubtitle}>Track your progress and achieve your dreams</Text>
          </View>

          <AddSavingsGoalForm />
          <SavingsGoalsList />
        </ScrollView>
      </SafeAreaView>
    </SavingsProvider>
  );
}

const styles = StyleSheet.create({
  // Main Container Styles
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Lighter background
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 20,
  },

  // Loading Styles
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Header Styles with Gradient-like Effect
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 17,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Enhanced Form Container
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 10,
  },

  // Enhanced Input Styles
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    color: '#1E293B',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Enhanced Submit Button
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1 }],
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Goals List Styles
  goalsListContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  goalsListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  goalsListTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 10,
    letterSpacing: -0.3,
    flex: 1,
  },
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  savedText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Enhanced Empty State
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    color: '#64748B',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 26,
    fontWeight: '500',
  },

  goalsList: {
    flex: 1,
  },

  // Enhanced Goal Card with Modern Design
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  goalInfo: {
    flex: 1,
    paddingRight: 12,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  goalCategory: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },

  // Enhanced Progress Section
  progressSection: {
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  progressPercentage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  progressBarContainer: {
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  // Enhanced Amount Section
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  amountBox: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  amountLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -0.3,
  },
  targetAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: -0.3,
  },

  // Enhanced Remaining Section
  remainingSection: {
    marginBottom: 20,
    backgroundColor: '#FEF7FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  remainingText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 10,
    fontWeight: '500',
  },
  remainingAmount: {
    fontWeight: '700',
    color: '#7C3AED',
    fontSize: 16,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
  },
  deadlineText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  daysRemaining: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Enhanced Completed Section
  completedSection: {
    marginBottom: 20,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedText: {
    color: '#059669',
    fontWeight: '700',
    marginLeft: 10,
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Enhanced Add Money Section
  addMoneySection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addMoneyInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    fontWeight: '500',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 80,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Additional Modern Touches
  cardSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
    marginHorizontal: -24,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});