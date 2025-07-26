// app/group/[id].tsx
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
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Group, GroupItem, CreateItemData } from '../../lib/types';
import { getGroups, getGroupItems, createItem, deleteItem, subscribeToGroupItems } from '../../lib/database';
import { formatDate, formatAmount, calculateRemainingAmount } from '../../lib/utils';

const GroupDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [items, setItems] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GroupItem | null>(null);
  const [formData, setFormData] = useState({
    item_name: '',
    amount: '',
    sent_by: '',
    received_by: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (id) {
      loadGroupAndItems();
      
      // Subscribe to real-time updates for this group's items
      const subscription = subscribeToGroupItems(id, setItems);
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id]);

  const loadGroupAndItems = async () => {
    setLoading(true);
    try {
      const groups = await getGroups();
      const currentGroup = groups.find(g => g.id === id);
      if (currentGroup) {
        setGroup(currentGroup);
        const groupItems = await getGroupItems(id);
        setItems(groupItems);
      } else {
        Alert.alert('Error', 'Group not found');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load group');
      router.back();
    }
    setLoading(false);
  };

  const handleCreateItem = async () => {
    if (!formData.item_name.trim() || !formData.amount.trim() || !formData.sent_by.trim() || !formData.received_by.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!group) return;

    const remainingAmount = calculateRemainingAmount(group.amount, items);
    if (amount > remainingAmount) {
      Alert.alert('Error', `Amount exceeds remaining balance of ${formatAmount(remainingAmount)}`);
      return;
    }

    const itemData: CreateItemData = {
      group_id: id,
      item_name: formData.item_name.trim(),
      amount,
      date: formData.date,
      sent_by: formData.sent_by.trim(),
      received_by: formData.received_by.trim(),
    };

    const newItem = await createItem(itemData);
    if (newItem) {
      setModalVisible(false);
      setFormData({
        item_name: '',
        amount: '',
        sent_by: '',
        received_by: '',
        date: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Success', 'Item added successfully!');
    } else {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleDeleteItem = (item: GroupItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.item_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteItem(item.id, id);
            if (success) {
              Alert.alert('Success', 'Item deleted successfully!');
            } else {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const showItemDetails = (item: GroupItem) => {
    setSelectedItem(item);
  };

  const renderItem = ({ item }: { item: GroupItem }) => {
    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => showItemDetails(item)}
        onLongPress={() => handleDeleteItem(item)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.item_name}
          </Text>
          <TouchableOpacity
            style={styles.deleteItemButton}
            onPress={() => handleDeleteItem(item)}
          >
            <IconSymbol name="trash" size={14} color="#FF4444" />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemAmount}>{formatAmount(item.amount)}</Text>
        <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const remainingAmount = calculateRemainingAmount(group.amount, items);

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header with Group Amount */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.amountContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <Text style={styles.amountText}>
              {formatAmount(remainingAmount)} / {formatAmount(group.amount)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <IconSymbol name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Items List */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="list.bullet" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>No items yet</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add your first item</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Item Name"
              placeholderTextColor="#999" 
              value={formData.item_name}
              onChangeText={(text) => setFormData({ ...formData, item_name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount (₵)"
              placeholderTextColor="#999" 
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Sent By"
              placeholderTextColor="#999" 
              value={formData.sent_by}
              onChangeText={(text) => setFormData({ ...formData, sent_by: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Received By"
              placeholderTextColor="#999" 
              value={formData.received_by}
              onChangeText={(text) => setFormData({ ...formData, received_by: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#999" 
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateItem}
            >
              <Text style={styles.createButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Item Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedItem}
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Item Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedItem(null)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Name:</Text>
                  <Text style={styles.detailValue}>{selectedItem.item_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>{formatAmount(selectedItem.amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedItem.date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sent By:</Text>
                  <Text style={styles.detailValue}>{selectedItem.sent_by}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Received By:</Text>
                  <Text style={styles.detailValue}>{selectedItem.received_by}</Text>
                </View>
              </View>
            )}
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
  stickyHeader: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  amountContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
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
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  deleteItemButton: {
    padding: 4,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  itemDate: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
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
  detailsContainer: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  detailValue: {
    fontSize: 16,
    color: '#212529',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
});

export default GroupDetail; 