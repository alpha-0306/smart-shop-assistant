import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getExpiryStatus } from '../utils/expiryUtils';
import { spacing, borderRadius } from '../utils/theme';

interface ExpiryBadgeProps {
  expiryDate: number;
  small?: boolean;
}

export default function ExpiryBadge({ expiryDate, small = false }: ExpiryBadgeProps) {
  const status = getExpiryStatus(expiryDate);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: status.color },
        small && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.text, small && styles.textSmall]}>
        {status.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeSmall: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 9,
  },
});
