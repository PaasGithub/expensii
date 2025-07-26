import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

const Media = () => {
  return (
    <View style={styles.container}>
      <Text>Media</Text>
    </View>
  );
};

export default Media;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 