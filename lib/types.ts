export interface Group {
  id: string;
  title: string;
  amount: number;
  group_type: 'add' | 'subtract';
  date: string;
  created_at: string;
  last_activity: string;
}

export interface GroupItem {
  id: string;
  group_id: string;
  item_name: string;
  amount: number;
  date: string;
  sent_by: string;
  received_by: string;
  created_at: string;
}

export interface CreateGroupData {
  title: string;
  amount: number;
  group_type: 'add' | 'subtract';
  date: string;
}

export interface CreateItemData {
  group_id: string;
  item_name: string;
  amount: number;
  date: string;
  sent_by: string;
  received_by: string;
} 