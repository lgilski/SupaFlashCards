import { createContext } from 'react-router';
import type { User } from '@supabase/supabase-js';

// For middleware for authentication
export const userContext = createContext<User | null>(null);
