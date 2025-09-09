import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    MapPin, 
    Trash2, 
    Droplet, 
    Lightbulb, 
    Trees, 
    Construction
} from 'lucide-react';

const categories = [
    {
        Icon: MapPin,
        title: "Road Issues",
        description: "Report potholes, broken roads, and traffic signals",
        path: "/map?category=road",
        code: "janhit/road-issues",
        color: "blue"
    },
    {
        Icon: Trash2,
        title: "Garbage Collection",
        description: "Track and report waste management issues",
        path: "/map?category=garbage",
        code: "janhit/garbage-collection",
        color: "green"
    },
    {
        Icon: Droplet,
        title: "Water Supply",
        description: "Report water-related problems in your area",
        path: "/map?category=water",
        code: "janhit/water-supply",
        color: "cyan"
    },
    {
        Icon: Lightbulb,
        title: "Street Lights",
        description: "Report non-functional or damaged street lights",
        path: "/map?category=lights",
        code: "janhit/street-lights",
        color: "yellow"
    },
    {
        Icon: Trees,
        title: "Parks & Gardens",
        description: "Report issues in public parks and green spaces",
        path: "/map?category=parks",
        code: "janhit/parks-gardens",
        color: "emerald"
    },
    {
        Icon: Construction,
        title: "Infrastructure",
        description: "Report issues with public infrastructure",
        path: "/map?category=infrastructure",
        code: "janhit/infrastructure",
        color: "orange"
    }
];

const getColorClasses = (color: string) => ({
    bg: `bg-${color}-50`,
    text: `text-${color}-500`,
    border: `hover:border-${color}-100`
});

const HeroSection: React.FC = () => {
    return (
        <section className="relative pt-20 pb-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                {/* Main Heading */}
                <div className="text-center mb-20">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl sm:text-6xl lg:text-7xl font-bold text-[#303030] mb-6 tracking-tight"
                    >
                        Your one-stop platform for
                        <br />
                        civic reporting
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg sm:text-xl text-[#666666] max-w-3xl mx-auto"
                    >
                        Janhit is the largest ecosystem where citizens report, track, and resolve civic issues.
                        Join thousands in making your city better.
                    </motion.p>
                </div>

                {/* Category Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
                >
                    {categories.map((category, index) => {
                        const colors = getColorClasses(category.color);
                        return (
                            <Link 
                                key={index}
                                to={category.path}
                                className={`group bg-white rounded-xl border border-gray-200 ${colors.border} hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 p-6 flex flex-col`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2 ${colors.bg} rounded-lg`}>
                                        <category.Icon className={`w-6 h-6 ${colors.text}`} />
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-semibold text-[#303030] mb-2">
                                    {category.title}
                                </h3>
                                
                                <p className="text-[#666666] text-sm mb-4 flex-grow">
                                    {category.description}
                                </p>

                                <div className="text-sm font-mono text-gray-400 pt-4 border-t border-gray-100">
                                    {category.code}
                                </div>
                            </Link>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;