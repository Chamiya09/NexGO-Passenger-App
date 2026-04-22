import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ProfileDetailRow = {
  label: string;
  value: string;
};

type ProfileDetailsGroupProps = {
  title: string;
  rows: ProfileDetailRow[];
};

export function ProfileDetailsGroup({ title, rows }: ProfileDetailsGroupProps) {
  return (
    <>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>
        {rows.map((row, index) => (
          <View key={`${title}-${row.label}`}>
            <View style={styles.row}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>{row.value}</Text>
            </View>
            {index < rows.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E9190',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  groupCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E7ECEB',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F1',
    marginLeft: 14,
  },
  label: {
    fontSize: 15,
    color: '#2E4C49',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#617977',
  },
});
