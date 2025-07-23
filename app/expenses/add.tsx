import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { v4 as uuid } from 'uuid';
import { useTransactions } from '../context/TransactionContext';

export default function AddExpenseScreen() {
  const { addTransaction } = useTransactions();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Food');

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    addTransaction({
      id: uuid(),
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      type,
      date: new Date().toLocaleDateString(),
    });

    // Show success feedback
    Alert.alert(
      'Success', 
      `${type === 'income' ? 'Income' : 'Expense'} added successfully!`,
      [{ text: 'OK', onPress: () => router.replace('/expenses') }]
    );
  };

  const categoryOptions = {
    expense: [
      { label: '🍔 Food & Dining', value: 'Food' },
      { label: '🚗 Transportation', value: 'Transport' },
      { label: '🛒 Shopping', value: 'Shopping' },
      { label: '🏠 Housing', value: 'Housing' },
      { label: '⚡ Utilities', value: 'Utilities' },
      { label: '🎯 Entertainment', value: 'Entertainment' },
      { label: '🏥 Healthcare', value: 'Healthcare' },
      { label: '📚 Education', value: 'Education' },
      { label: '👕 Clothing', value: 'Clothing' },
      { label: '💼 Other', value: 'Other' }
    ],
    income: [
      { label: '💰 Salary', value: 'Salary' },
      { label: '💼 Freelance', value: 'Freelance' },
      { label: '📈 Investment', value: 'Investment' },
      { label: '🎁 Gift', value: 'Gift' },
      { label: '💸 Bonus', value: 'Bonus' },
      { label: '🏪 Business', value: 'Business' },
      { label: '🏠 Rental', value: 'Rental' },
      { label: '💡 Other', value: 'Other' }
    ]
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Transaction</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Transaction Type Toggle */}
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                styles.expenseButton,
                type === 'expense' && styles.activeExpenseButton
              ]}
              onPress={() => {
                setType('expense');
                setCategory('Food');
              }}
            >
              <Text style={[
                styles.typeButtonText,
                type === 'expense' && styles.activeTypeButtonText
              ]}>
                💸 Expense
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                styles.incomeButton,
                type === 'income' && styles.activeIncomeButton
              ]}
              onPress={() => {
                setType('income');
                setCategory('Salary');
              }}
            >
              <Text style={[
                styles.typeButtonText,
                type === 'income' && styles.activeTypeButtonText
              ]}>
                💰 Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.amountInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Enter description"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Category Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(value) => setCategory(value)}
                style={styles.picker}
              >
                {categoryOptions[type].map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            type === 'expense' ? styles.expenseSubmitButton : styles.incomeSubmitButton
          ]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            Add {type === 'income' ? 'Income' : 'Expense'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 60,
  },
  formContainer: {
    padding: 20,
    gap: 24,
  },
  typeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  expenseButton: {
    backgroundColor: 'transparent',
  },
  incomeButton: {
    backgroundColor: 'transparent',
  },
  activeExpenseButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  activeIncomeButton: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTypeButtonText: {
    color: '#374151',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#111827',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  expenseSubmitButton: {
    backgroundColor: '#EF4444',
  },
  incomeSubmitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});