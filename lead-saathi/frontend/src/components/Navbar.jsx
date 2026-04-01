import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, PhoneCall } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center py-6 px-10 border-b border-white/10 glass-card mx-4 mt-4 relative z-40">
      <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-white">
        <Bot className="text-goldAccent" size={32} />
        LEAD SAARTHI
      </Link>
      <div className="flex gap-6">
        <Link to="/demo" className="bg-goldAccent hover:bg-yellow-600 text-darkBg font-semibold py-2 px-6 rounded-full transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(230,201,168,0.4)]">
          <PhoneCall size={18} />
          Start Demo
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;
