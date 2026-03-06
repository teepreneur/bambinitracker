import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24, // 24 hours (how long it stays in cache)
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

const isNode = typeof window === 'undefined';

export const asyncStoragePersister = createAsyncStoragePersister({
    storage: isNode ? undefined : AsyncStorage,
});
