# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up/log in
2. Click "New Project"
3. Fill in project details (name, password, region)
4. Wait for project initialization

## 2. Set Up Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-setup.sql` into the editor
4. Click "Run" to execute the SQL script

This will create:
- `groups` table with columns: id, title, amount, date, created_at, last_activity
- `group_items` table with columns: id, group_id, item_name, amount, date, sent_by, received_by, created_at
- Proper indexes and triggers for performance
- Row Level Security policies (currently allowing all operations)

## 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Project Settings > API**
2. Copy the **Project URL** and **anon public key**

## 4. Update Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```
SUPABASE_URL=your_actual_supabase_url
SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

## 5. Install Dependencies

Make sure you have the required packages installed:

```bash
yarn add react-native-dotenv
```

## 6. Test the App

1. Start your development server: `yarn start`
2. Navigate to the Groups tab
3. Try creating a group and adding items

## Features Implemented

✅ **Groups Tab**: Shows list of groups as cards with remaining/total amounts
✅ **Create Groups**: Modal with title, amount, and date inputs
✅ **Group Detail Page**: Shows items in a group with sticky header showing remaining amount
✅ **Add Items**: Modal with all required fields (item name, amount, sent by, received by, date)
✅ **Item Details**: Modal showing all item information when tapped
✅ **Delete Groups**: Long press or tap trash icon to delete groups
✅ **Delete Items**: Long press or tap trash icon to delete items
✅ **Real-time Updates**: Changes sync across devices instantly
✅ **Amount Validation**: Prevents adding items that exceed remaining balance
✅ **Modern UI**: Rounded cards, shadows, and clean design
✅ **Ghana Cedi Formatting**: Amounts displayed with ₵ symbol
✅ **Date Formatting**: Dates in DD/MM/YYYY format

## Database Schema

### Groups Table
- `id`: UUID (Primary Key)
- `title`: TEXT (Group name)
- `amount`: DECIMAL (Total budget)
- `date`: DATE (Group creation date)
- `created_at`: TIMESTAMP (Auto-generated)
- `last_activity`: TIMESTAMP (Updated when items are added/modified)

### Group Items Table
- `id`: UUID (Primary Key)
- `group_id`: UUID (Foreign Key to groups)
- `item_name`: TEXT (Item description)
- `amount`: DECIMAL (Item cost)
- `date`: DATE (Item date)
- `sent_by`: TEXT (Who sent the money)
- `received_by`: TEXT (Who received the money)
- `created_at`: TIMESTAMP (Auto-generated)

## Real-time Features

The app uses Supabase's real-time subscriptions to:
- Update group lists when groups are created/deleted
- Update item lists when items are added/deleted
- Show real-time remaining amounts
- Sync changes across multiple devices instantly

## Future Enhancements

- User authentication
- Group sharing between users
- Export functionality
- Categories for items
- Budget alerts
- Analytics and reports 