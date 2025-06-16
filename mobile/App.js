import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import './i18n';

export default function App() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <Text>{t('mobile_welcome')}</Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
