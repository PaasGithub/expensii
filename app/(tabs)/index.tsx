import { useState } from "react";
import { Button, Modal, StyleSheet, Text, View } from "react-native";
import ExpenseTracker from "../components/TableComponent";
import 'react-native-get-random-values'

export default function Index() {

  return (

      <>
   
        <ExpenseTracker/>
    
      </>
  
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
});
