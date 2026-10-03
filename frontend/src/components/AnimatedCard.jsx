import { motion } from "framer-motion";

export default function AnimatedCard({ children, style, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
