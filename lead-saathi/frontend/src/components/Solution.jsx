import React from 'react';
import { motion } from 'framer-motion';

const Solution = () => {
  const steps = [
    "Initiate Call", "Ask Questions", "Understand Context", "Calculate Score", "Filter Leads", "Action & Follow-up"
  ];

  return (
    <section className="py-20 px-8 bg-black/20 relative">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">The Lead Saarthi Workflow</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-full"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-goldAccent text-darkBg w-8 h-8 rounded-full flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <span className="font-semibold">{step}</span>
              {i < steps.length - 1 && <div className="hidden md:block w-8 border-t border-dashed border-gray-600 ml-4" />}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Solution;
