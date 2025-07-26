import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// import AudioComponentSecondary from './AudioComponentSecondary';
import { useExpenseContext } from '../context/ExpenseContext';
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid';

interface ExpenseItem {
  id: string;
  item: string;
  price: number;
  date: string;
}

const ExpenseTracker: React.FC = () => {
  // const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const { expenses, addExpense, deleteExpense, updateExpense } = useExpenseContext();  const [newItem, setNewItem] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  // const [showAudio, setShowAudio] = useState(false);


  const handleAddExpense = () => {
    if (newItem && newPrice && !isNaN(Number(newPrice))) {
      const expense: ExpenseItem = {
        id: uuidv4(),
        item: newItem,
        price: Number(newPrice),
        date: new Date().toLocaleDateString(),
      };
      // setExpenses([...expenses, expense]);
      addExpense(expense);
      setNewItem('');
      setNewPrice('');
    }
  };

  // const deleteExpense = (id: string) => {
  //   setExpenses(expenses.filter(expense => expense.id !== id));
  // };

  const startEditing = (id: string) => {
    setEditingId(id);
  };

  // const updateExpense = (id: string, field: 'item' | 'price', value: string) => {
  //   setExpenses(expenses.map(expense => {
  //     if (expense.id === id) {
  //       return {
  //         ...expense,
  //         [field]: field === 'price' ? Number(value) : value
  //       };
  //     }
  //     return expense;
  //   }));
  // };

  const finishEditing = () => {
    setEditingId(null);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.price, 0);

  // const handleLongPress = () => {
  //   if (Platform.OS === 'ios') {
  //     ActionSheetIOS.showActionSheetWithOptions(
  //       {
  //         options: ['Record Audio', 'Expense Table', 'Cancel'],
  //         cancelButtonIndex: 2,
  //       },
  //       (buttonIndex) => {
  //         if (buttonIndex === 0) setShowAudio(true);
  //         else setShowAudio(false);
  //       }
  //     );
  //   } else {
  //     // Implement a modal for Android if needed
  //     setShowAudio(true);
  //   }
  // };

  return (
   
        <View style={styles.trackerContainer}>

            <View style={styles.totalContainer}>
                <Text style={styles.totalText}>Total: ${totalExpenses.toFixed(2)}</Text>
            </View>
        

            <ScrollView style={styles.tableContainer}>
                <View style={styles.headerRow}>
                <Text style={[styles.headerCell, styles.itemCell]}>Item</Text>
                <Text style={[styles.headerCell, styles.priceCell]}>Price</Text>
                <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
                <Text style={[styles.headerCell, styles.actionCell]}>Actions</Text>
                </View>

                {expenses.map(expense => (
                <View key={expense.id} style={styles.row}>
                    <View style={styles.itemCell}>
                    {editingId === expense.id ? (
                        <TextInput
                        style={styles.editInput}
                        value={expense.item}
                        onChangeText={(value) => updateExpense(expense.id, 'item', value)}
                        onBlur={finishEditing}
                        />
                    ) : (
                        <Text>{expense.item}</Text>
                    )}
                    </View>
                    <View style={styles.priceCell}>
                    {editingId === expense.id ? (
                        <TextInput
                        style={styles.editInput}
                        value={expense.price.toString()}
                        onChangeText={(value) => updateExpense(expense.id, 'price', value)}
                        keyboardType="numeric"
                        onBlur={finishEditing}
                        />
                    ) : (
                        <Text>${expense.price.toFixed(2)}</Text>
                    )}
                    </View>
                    <Text style={[styles.dateCell, {fontSize:10}]}>{expense.date}</Text>
                    <View style={styles.actionCell}>
                    <TouchableOpacity 
                        onPress={() => editingId === expense.id ? finishEditing() : startEditing(expense.id)}
                        style={styles.actionButton}
                    >
                        <MaterialIcons 
                        name={editingId === expense.id ? "check" : "edit"} 
                        size={20} 
                        color="#2196F3" 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => deleteExpense(expense.id)}
                        style={styles.actionButton}
                    >
                        <MaterialIcons name="delete" size={20} color="#f44336" />
                    </TouchableOpacity>
                    </View>
                </View>
                ))}
            </ScrollView>

            {/* <View style={styles.inputContainer}> */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}  
                style={styles.inputContainer}
            >
            
                        <TextInput
                            style={styles.input}
                            placeholder="Item name"
                            value={newItem}
                            onChangeText={setNewItem}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Price"
                            value={newPrice}
                            onChangeText={setNewPrice}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
                            <MaterialIcons name="add" size={24} color="white" />
                        </TouchableOpacity>
                
            </KeyboardAvoidingView>      
        </View>
  );
};

const styles = StyleSheet.create({
  trackerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    // marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    flex: 1,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  headerCell: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  itemCell: {
    flex: 2,
    paddingRight: 10,
  },
  priceCell: {
    flex: 1,
    paddingRight: 10,
  },
  dateCell: {
    flex: 1,
    paddingRight: 10,
  },
  actionCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 5,
    marginLeft: 5,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 3,
    padding: 5,
  },
  totalContainer: {
    padding: 15,
    // backgroundColor: '#f5f5f5',
    // borderRadius: 5,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
});

export default ExpenseTracker;