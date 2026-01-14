'use client';

import { Hero } from "@/components/sections/Hero";
import { Footer } from "@/components/layout/Footer";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function HomePage() {
  const [messageCount, setMessageCount] = useState(0);

  return (
    <>
      <Hero onMessagesChange={setMessageCount} />
      <AnimatePresence mode="wait">
        {messageCount === 0 && (
          <motion.div
            key="footer"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
