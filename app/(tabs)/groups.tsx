// app/(tabs)/groups.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Group, CreateGroupData } from '../../lib/types';
import { createGroup, getGroups, deleteGroup, subscribeToGroups, getGroupItems, subscribeToGroupItems } from '../../lib/database';
import { formatDate, formatAmount, calculateRemainingAmount, calculateTotalAmount } from '../../lib/utils';
import { router } from 'expo-router';
import { PerformanceMonitor } from '../components/PerformanceMonitor';

// ---------- Group Card Component ----------
const GroupCard = ({ item, handleDeleteGroup }: { item: Group; handleDeleteGroup: (group: Group) => void }) => {
  const [displayAmount, setDisplayAmount] = useState(item.amount);
  const [loadingAmount, setLoadingAmount] = useState(true);

  useEffect(() => {
    const loadDisplayAmount = async () => {
      const items = await getGroupItems(item.id);
      const amount = calculateRemainingAmount(item.amount, items, item.group_type);
      setDisplayAmount(amount);
      setLoadingAmount(false);
    };

    loadDisplayAmount();

    // Subscribe to real-time updates for this group's items
    const subscription = subscribeToGroupItems(item.id, (updatedItems) => {
        const amount = calculateTotalAmount(item.amount, updatedItems, item.group_type);
        setDisplayAmount(amount);
        setLoadingAmount(false);
    });
      
    return () => {
        subscription.unsubscribe();
    };
  }, [item.id, item.amount, item.group_type]);

  return (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => router.push(`/group/${item.id}`)}
      onLongPress={() => handleDeleteGroup(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.groupTitle} numberOfLines={1}>
          {item.group_type === 'add'
            ?  `${item.title} (Add)`
            : `${item.title}`
          }
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteGroup(item)}>
          <IconSymbol name="trash" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.amountContainer}>
        {loadingAmount ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={styles.amountText}>
            {item.group_type === 'add' 
              ? `${formatAmount(displayAmount)}` 
              : `${formatAmount(displayAmount)} / ${formatAmount(item.amount)}`
            }
          </Text>
        )}
      </View>
      <Text style={styles.dateText}>Created: {formatDate(item.created_at)}</Text>
    </TouchableOpacity>
  );
};

// ---------- Groups Component ----------
const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'add' | 'subtract'>('all');
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    amount: '', 
    group_type: 'subtract' as 'add' | 'subtract',
    date: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    loadGroups();
    const subscription = subscribeToGroups(setGroups);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const groupsData = await getGroups();
    setGroups(groupsData);
    setLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please fill in the group title');
      return;
    }

    let amount = 0;
    if (formData.group_type === 'subtract') {
      if (!formData.amount.trim()) {
        Alert.alert('Error', 'Please enter an amount for subtract groups');
        return;
      }
      amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
    }else{amount = 0;}

    

    const groupData: CreateGroupData = { 
      title: formData.title.trim(), 
      amount, 
      group_type: formData.group_type,
      date: formData.date 
    };
    const newGroup = await createGroup(groupData);
    if (newGroup) {
      // FORCE REFRESH
      await loadGroups();

      // CLEAR FORM DATA
      setModalVisible(false);
      setFormData({ 
        title: '', 
        amount: '', 
        group_type: 'subtract',
        date: new Date().toISOString().split('T')[0] 
      });
      Alert.alert('Success', 'Group created successfully!');
    } else {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const handleDeleteGroup = (group: Group) => {
    Alert.alert('Delete Group', `Are you sure you want to delete "${group.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteGroup(group.id);
          // FORCE REFRESH
          await loadGroups();
          Alert.alert(success ? 'Success' : 'Error', success ? 'Group deleted successfully!' : 'Failed to delete group');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredGroups = groups.filter(group => {
    if (filterType === 'all') return true;
    return group.group_type === filterType;
  });

  const getFilterIcon = () => {
    switch (filterType) {
      case 'add': return 'plus.circle';
      case 'subtract': return 'minus.circle';
      default: return 'line.3.horizontal.decrease.circle';
    }
  };

  const cycleFilter = () => {
    setFilterType(prev => {
      switch (prev) {
        case 'all': return 'add';
        case 'add': return 'subtract';
        case 'subtract': return 'all';
        default: return 'all';
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.filterButton} onPress={cycleFilter}>
            <IconSymbol name={getFilterIcon()} size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.performanceButton} onPress={() => setShowPerformanceMonitor(true)}>
            <IconSymbol name="chart.bar" size={20} color="#6C757D" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <IconSymbol name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="folder" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>No groups yet</Text>
          <Text style={styles.emptySubtext}>Tap the + button to create your first group</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={({ item }) => <GroupCard item={item} handleDeleteGroup={handleDeleteGroup} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Performance Monitor */}
      <PerformanceMonitor 
        visible={showPerformanceMonitor} 
        onClose={() => setShowPerformanceMonitor(false)} 
      />

      {/* Create Group Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Group Title"
              placeholderTextColor="#999" 
              value={formData.title} onChangeText={(text) => setFormData({ ...formData, title: text })} />
            
            {/* Group Type Selection */}
            <View style={styles.typeContainer}>
              <Text style={styles.typeLabel}>Group Type:</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.group_type === 'add' && styles.typeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, group_type: 'add' })}
                >
                  <IconSymbol name="plus" size={16} color={formData.group_type === 'add' ? 'white' : '#007AFF'} />
                  <Text style={[
                    styles.typeButtonText,
                    formData.group_type === 'add' && styles.typeButtonTextActive
                  ]}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.group_type === 'subtract' && styles.typeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, group_type: 'subtract' })}
                >
                  <IconSymbol name="minus" size={16} color={formData.group_type === 'subtract' ? 'white' : '#007AFF'} />
                  <Text style={[
                    styles.typeButtonText,
                    formData.group_type === 'subtract' && styles.typeButtonTextActive
                  ]}>Subtract</Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.group_type === 'subtract' && (
              <TextInput style={styles.input} placeholder="Amount (₵)"
                placeholderTextColor="#999" 
                value={formData.amount} onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="numeric" />
            )}
            
            <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#999" 
              value={formData.date} onChangeText={(text) => setFormData({ ...formData, date: text })} />
            <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
              <Text style={styles.createButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    padding: 8,
  },
  performanceButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    padding: 16,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  amountContainer: {
    marginBottom: 8,
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  dateText: {
    fontSize: 14,
    color: '#6C757D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6C757D',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#ADB5BD',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: 'white',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  typeButtonTextActive: {
    color: 'white',
  },
});

export default Groups; 