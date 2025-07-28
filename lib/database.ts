import { supabase } from './supabase';
import { Group, GroupItem, CreateGroupData, CreateItemData } from './types';
import { performanceMonitor } from './utils';

// Groups functions
export const createGroup = async (data: CreateGroupData): Promise<Group | null> => {
  const { data: group, error } = await supabase
    .from('groups')
    .insert([{
      title: data.title,
      amount: data.amount,
      group_type: data.group_type,
      date: data.date,
      last_activity: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating group:', error);
    return null;
  }

  return group;
};

export const getGroups = async (): Promise<Group[]> => {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  return groups || [];
};

export const getGroupsWithCalculatedAmounts = async (): Promise<(Group & { calculated_amount: number })[]> => {
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_items(amount)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching groups with amounts:', error);
    return [];
  }

  // Calculate amounts for each group
  const groupsWithAmounts = (groups || []).map(group => {
    const totalItems = group.group_items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
    const calculatedAmount = group.group_type === 'add' 
      ? totalItems 
      : group.amount - totalItems;
    
    return {
      ...group,
      calculated_amount: calculatedAmount
    };
  });

  return groupsWithAmounts;
};

export const deleteGroup = async (id: string): Promise<boolean> => {
  // First delete all items in the group
  const { error: itemsError } = await supabase
    .from('group_items')
    .delete()
    .eq('group_id', id);

  if (itemsError) {
    console.error('Error deleting group items:', itemsError);
  }

  // Then delete the group
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting group:', error);
    return false;
  }

  return true;
};

// Items functions
export const createItem = async (data: CreateItemData): Promise<GroupItem | null> => {
  const { data: item, error } = await supabase
    .from('group_items')
    .insert([{
      group_id: data.group_id,
      item_name: data.item_name,
      amount: data.amount,
      date: data.date,
      sent_by: data.sent_by,
      received_by: data.received_by
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating item:', error);
    return null;
  }

  // Update group's last activity
  await supabase
    .from('groups')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', data.group_id);

  return item;
};

export const getGroupItems = async (group_id: string): Promise<GroupItem[]> => {
  const { data: items, error } = await supabase
    .from('group_items')
    .select('*')
    .eq('group_id', group_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching group items:', error);
    return [];
  }

  return items || [];
};

export const deleteItem = async (id: string, group_id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('group_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting item:', error);
    return false;
  }

  // Update group's last activity
  await supabase
    .from('groups')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', group_id);

  return true;
};

export const updateItem = async (id: string, group_id: string, data: Partial<CreateItemData>): Promise<GroupItem | null> => {
  const { data: item, error } = await supabase
    .from('group_items')
    .update({
      item_name: data.item_name,
      amount: data.amount,
      date: data.date,
      sent_by: data.sent_by,
      received_by: data.received_by
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating item:', error);
    return null;
  }

  // Update group's last activity
  await supabase
    .from('groups')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', group_id);

  return item;
};

// Real-time subscriptions
// In lib/database.ts - Add debugging to your subscription functions
export const subscribeToGroups = (callback: (groups: Group[]) => void) => {
  // console.log('Setting up groups subscription...');
  
  return supabase
    .channel('groups_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
      // console.log('Groups subscription triggered!', payload);
      getGroups().then(callback);
    })
    .subscribe((status) => {
      // console.log('Groups subscription status:', status);
    });
};

export const subscribeToGroupItems = (group_id: string, callback: (items: GroupItem[]) => void) => {
  // console.log(`Setting up group items subscription for group: ${group_id}`);
  
  return supabase
    .channel(`group_items_${group_id}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'group_items', 
      filter: `group_id=eq.${group_id}` 
    }, (payload) => {
      // console.log('Group items subscription triggered!', payload);
      getGroupItems(group_id).then(callback);
    })
    .subscribe((status) => {
      // console.log(`Group items subscription status for ${group_id}:`, status);
    });
};