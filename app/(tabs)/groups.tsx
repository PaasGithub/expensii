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
import { formatDate, formatAmount, calculateRemainingAmount } from '../../lib/utils';
import { router } from 'expo-router';

// ---------- Group Card Component ----------
const GroupCard = ({ item, handleDeleteGroup }: { item: Group; handleDeleteGroup: (group: Group) => void }) => {
  const [remainingAmount, setRemainingAmount] = useState(item.amount);
  const [loadingAmount, setLoadingAmount] = useState(true);

  useEffect(() => {
    const loadRemainingAmount = async () => {
      const items = await getGroupItems(item.id);
      const remaining = calculateRemainingAmount(item.amount, items);
      setRemainingAmount(remaining);
      setLoadingAmount(false);
    };

    loadRemainingAmount();

    // Subscribe to real-time updates for this group's items
    const subscription = subscribeToGroupItems(item.id, (updatedItems) => {
        const remaining = calculateRemainingAmount(item.amount, updatedItems);
            setRemainingAmount(remaining);
            setLoadingAmount(false);
        });
      
        return () => {
            subscription.unsubscribe();
        };
  }, [item.id, item.amount]);

  return (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => router.push(`/group/${item.id}`)}
      onLongPress={() => handleDeleteGroup(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.groupTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteGroup(item)}>
          <IconSymbol name="trash" size={16} color="#FF4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.amountContainer}>
        {loadingAmount ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={styles.amountText}>{formatAmount(remainingAmount)} / {formatAmount(item.amount)}</Text>
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
  const [formData, setFormData] = useState({ title: '', amount: '', date: new Date().toISOString().split('T')[0] });

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
    if (!formData.title.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const groupData: CreateGroupData = { title: formData.title.trim(), amount, date: formData.date };
    const newGroup = await createGroup(groupData);
    if (newGroup) {
      setModalVisible(false);
      setFormData({ title: '', amount: '', date: new Date().toISOString().split('T')[0] });
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <IconSymbol name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="folder" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>No groups yet</Text>
          <Text style={styles.emptySubtext}>Tap the + button to create your first group</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={({ item }) => <GroupCard item={item} handleDeleteGroup={handleDeleteGroup} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

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
            <TextInput style={styles.input} placeholder="Amount (₵)"
              placeholderTextColor="#999" 
              value={formData.amount} onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="numeric" />
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
});

export default Groups; 