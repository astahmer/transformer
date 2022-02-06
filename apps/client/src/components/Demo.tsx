import { Box, Center } from "@chakra-ui/react";
import { motion } from "framer-motion";

export const Demo = () => {
    return (
        <Center h="100%">
            <motion.div animate={{ rotateX: 360 }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Box textAlign="center" fontSize="50px">
                    Ready to go
                </Box>
            </motion.div>
        </Center>
    );
};
