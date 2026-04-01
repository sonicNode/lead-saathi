import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingDown, Users } from 'lucide-react';

const Problem = () => {
  const stats = [
    { icon: <Clock size={40} className="text-red-400 mb-4" />, value: "3-4 Hours", label: "of daily sales time lost to manual qualification." },
    { icon: <Users size={40} className="text-blue-400 mb-4" />, value: "40-50%", label: "of leads called are unqualified, wasting effort." },
    { icon: <TrendingDown size={40} className="text-orange-400 mb-4" />, value: "₹25K-₹50K", label: "average monthly loss per SDR due to inefficiency." }
  ];

  return (
    <section className="py-20 px-8 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold text-center mb-16 text-white">The Qualification Crisis</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="glass-card p-8 flex flex-col items-center text-center"
          >
            {stat.icon}
            <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
            <p className="text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
export default Problem;
