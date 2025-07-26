import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

const calendar = () => {
  return (
    <View style={styles.container}>
      <Text>calendar</Text>
    </View>
  )
}

export default calendar;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
    