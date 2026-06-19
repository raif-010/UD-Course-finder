/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AccountRecord {
  id: string;
  password?: string;
  courses: string[];
  isFavorite?: boolean;
}

export interface SearchHistory {
  id: string;
  term: string;
  timestamp: string;
  resultsCount: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  autoCopyId: boolean;
  autoCopyPassword: boolean;
  soundEnabled: boolean;
  mockRowCount: number;
}
