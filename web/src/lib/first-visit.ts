import { createContext, useContext } from 'react';

// Pages animate in the first time they are opened in a session, then appear instantly.
const seen = new Set<string>();
export const isFirstVisit = (key: string) => !seen.has(key);
export const markVisited = (key: string) => void seen.add(key);
export const FirstVisit = createContext(true);
export const useFirstVisit = () => useContext(FirstVisit);
