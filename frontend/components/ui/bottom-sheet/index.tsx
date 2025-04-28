import React, { useRef, useMemo, useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";

export const BottomSheet = ({ children }: { children: any }) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ["5%", "50%", "60%"], []);

  const data = ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"];

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      bottomSheetModalRef.current?.snapToIndex(0); // Snap back to the smallest snap point
    }
  }, []);

  // Render each item in the list
  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item}</Text>
    </View>
  );

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={snapPoints}
        enableDismissOnClose={false}
        enablePanDownToClose={false}
        onChange={handleSheetChange}
        backgroundStyle={styles.bottomSheetBackground}
      >
        {children}
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  bottomSheetBackground: {
    position: "absolute",
    backgroundColor: "red",
    borderRadius: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  itemContainer: {
    padding: 16,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
  },
});
