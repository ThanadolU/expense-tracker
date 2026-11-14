import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thanadolu.expensetracker',
  appName: 'Expense Tracker',
  // Placeholder shell only — the real app is the deployed Next.js site below.
  webDir: 'cap-shell',
  server: {
    url: 'https://expense-tracker-five-ruby-66.vercel.app',
    cleartext: false,
  },
};

export default config;
