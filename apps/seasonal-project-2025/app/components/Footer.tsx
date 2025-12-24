"use client";

import { motion } from "framer-motion";
import { Github } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-20 bg-warmGray-50 border-t border-warmGray-200">
      <div className="max-w-7xl mx-auto px-2 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-between items-center"
        >
          <div className="text-center sm:text-left">
            <p className="text-sm text-warmGray-600">
              © {currentYear} Project Afterglow. All rights reserved.
            </p>
            <p className="text-xs text-warmGray-500 mt-1">
              Made with ❤️ by @dusunax
            </p>
          </div>
          <a
            href="https://github.com/dusunax/ux-lab/tree/main/apps/seasonal-project-2025"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-warmGray-600 hover:text-warmGray-900 transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="w-5 h-5" />
            <span className="text-sm font-medium">GitHub</span>
          </a>
        </motion.div>
      </div>
    </footer>
  );
}
