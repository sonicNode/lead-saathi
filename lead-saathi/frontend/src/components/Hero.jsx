import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="min-h-[80vh] flex flex-col justify-center items-center text-center px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-goldAccent/5 rounded-full blur-[120px] -z-10" />
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-white via-gray-300 to-goldAccent bg-clip-text text-transparent"
      >
        AI That Talks.<br />Understands.<br />Qualifies.
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-10"
      >
        Automate your lead qualification via intelligent voice conversations and BANT analysis in real-time.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Link to="/demo" className="text-darkBg bg-goldAccent text-lg font-bold py-4 px-10 rounded-full hover:scale-105 inline-block transition-transform shadow-[0_0_30px_rgba(230,201,168,0.5)]">
          Experience Live Demo
        </Link>
      </motion.div>
    </section>
  );
};
export default Hero;
