import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ExpenseProvider } from "./context/ExpenseContext";

export default function RootLayout() {
  return( 
    <ExpenseProvider>
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen
          name="(tabs)"
        />
      </Stack>

      <StatusBar style="dark" />
    </ExpenseProvider>
  );
}
