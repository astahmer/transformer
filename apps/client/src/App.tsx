import "./App.css";

import { ChakraProvider, Flex, extendTheme } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "react-query";

import { Demo } from "./components/Demo";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Transformer from "./components/transformer";
import { trpc } from "./trpc";

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({ url: "http://localhost:5000" });

const theme = extendTheme({ config: { initialColorMode: "light" } });

function App() {
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <ChakraProvider theme={theme}>
                    <Flex direction="column" boxSize="100%">
                        <BrowserRouter>
                            <Routes>
                                <Route path="/demo" element={<Demo />} />
                                <Route path="/" element={<Transformer />} />
                            </Routes>
                        </BrowserRouter>
                    </Flex>
                </ChakraProvider>
            </QueryClientProvider>
        </trpc.Provider>
    );
}

export default App;
