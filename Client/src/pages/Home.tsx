import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import HowItWorksSection from '../components/HowItWorksSection';
// import FeaturedIssues from '../components/FeaturedIssues';
import FaqSection from '../components/FaqSection';

const CtaBanner: React.FC = () => (
  <section className="bg-gray-900 py-20">
    <div className="max-w-7xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-white/80 max-w-xl">
              Join thousands of active citizens who are making their voices heard and their communities better.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/map"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
            >
              Report an Issue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white/10 transition-colors font-semibold"
            >
              Sign Up Now
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const Home: React.FC = () => {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      {/* <FeaturedIssues /> */}
      <FaqSection />
      <CtaBanner />
    </>
  );
};

export default Home;
