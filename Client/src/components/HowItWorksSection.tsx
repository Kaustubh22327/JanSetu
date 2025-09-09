import React from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Bell, ChevronRight, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
    {
        icon: Camera,
        title: "Report Issues",
        description: "Take photos, mark location, and describe civic problems in your area. Quick and easy reporting process.",
        path: "/map",
        code: "clockworks/report-issue"
    },
    {
        icon: MapPin,
        title: "Track Progress",
        description: "Monitor issue status on an interactive map. See nearby problems and their resolution progress in real-time.",
        path: "/map",
        code: "compass/issue-tracker"
    },
    {
        icon: Bell,
        title: "Get Notifications",
        description: "Receive updates when your reported issues are acknowledged, assigned, and resolved. Stay informed at every step.",
        path: "/notifications",
        code: "apify/notification-system"
    }
];

const HowItWorksSection: React.FC = () => {
    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid gap-8 md:grid-cols-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative bg-white rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200"
                        >
                            {/* Icon */}
                            <div className="mb-4">
                                <feature.icon className="w-12 h-12 text-blue-600" />
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-semibold text-[#303030] mb-3">
                                {feature.title}
                            </h3>

                            {/* Code Path */}
                            <div className="text-sm font-mono text-gray-500 mb-3">
                                {feature.code}
                            </div>

                            {/* Description */}
                            <p className="text-[#666666] mb-6">
                                {feature.description}
                            </p>

                            {/* Learn More Link */}
                            <Link
                                to={feature.path}
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Learn more
                                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            {/* Usage Stats */}
                            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-4">
                                <div className="flex items-center text-gray-600">
                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                    <span className="text-sm">4.5</span>
                                </div>
                                <div className="text-gray-600">
                                    <span className="text-sm">1.5K users</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;