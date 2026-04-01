import React from 'react';
import Hero from '../components/Hero';
import Problem from '../components/Problem';
import Solution from '../components/Solution';

const Home = () => {
  return (
    <div className="w-full">
      <Hero />
      <Problem />
      <Solution />
    </div>
  );
};
export default Home;
