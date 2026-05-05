import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CategoryTabsProps = {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
};

export function CategoryTabs({ categories, activeCategory, onChange }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {categories.map((category) => {
        const isActive = category === activeCategory;

        return (
          <TouchableOpacity
            key={category}
            activeOpacity={0.85}
            onPress={() => onChange(category)}
            style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}>
            <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
      <View style={styles.trailingSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: 6,
    gap: 10,
  },
  tab: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: '#169F95',
    borderColor: '#169F95',
  },
  tabInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DFE8E7',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabLabelInactive: {
    color: '#4C6664',
  },
  trailingSpace: {
    width: 4,
  },
});
