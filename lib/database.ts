import { supabase } from './supabase';
import { Group, GroupItem, CreateGroupData, CreateItemData } from './types';

// Groups functions
export const createGroup = async (data: CreateGroupData): Promise<Group | null> => {
  const { data: group, error } = await supabase
    .from('groups')
    .insert([{
      title: data.title,
      amount: data.amount,
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

// Real-time subscriptions
export const subscribeToGroups = (callback: (groups: Group[]) => void) => {
  return supabase
    .channel('groups_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
      getGroups().then(callback);
    })
    .subscribe();
};

export const subscribeToGroupItems = (group_id: string, callback: (items: GroupItem[]) => void) => {
  return supabase
    .channel(`group_items_${group_id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'group_items', filter: `group_id=eq.${group_id}` }, () => {
      getGroupItems(group_id).then(callback);
    })
    .subscribe();
}; 