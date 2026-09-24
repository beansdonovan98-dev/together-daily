import { Slot } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LocalJournalProvider } from "@/lib/local-journal";
import { createTRPCClient, trpc } from "@/lib/trpc";

export default function RootLayout() {
	const [queryClient] = useState(() => new QueryClient());
	const [trpcClient] = useState(() => createTRPCClient());

	return (
		<QueryClientProvider client={queryClient}>
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				<LocalJournalProvider>
					<Slot />
				</LocalJournalProvider>
			</trpc.Provider>
		</QueryClientProvider>
	);
}
