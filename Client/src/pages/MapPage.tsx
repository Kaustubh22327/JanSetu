import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
    Circle,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { API } from '../ApiUri';
import { WEATHER_CONFIG } from '../config/weather';

const issueIcon = new L.Icon({
    iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const liveLocationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

interface Comment {
    _id: string;
    comment: string;
    userMade: {
        _id: string;
        name: string;
    };
    toProblem: string;
    createdAt: string;
}

interface Issue {
    id: string;
    position: [number, number];
    description: string;
    severity: number;
    comments: Comment[];
    createdBy: string;
    voteCount?: number;
    averageRating?: number;
    address?: string;
    media?: string[];
}

interface IssueCluster {
    id: string;
    position: [number, number];
    issues: Issue[];
    count: number;
    averageSeverity: number;
}

interface WeatherData {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    condition: string;
    icon: string;
    timestamp: string;
}

interface WeatherCorrelation {
    issueType: string;
    weatherFactor: string;
    correlationStrength: number;
    riskLevel: 'low' | 'medium' | 'high';
    prediction: string;
}



const DangerRating: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => (
    <div className="flex space-x-1 cursor-pointer text-yellow-400 text-3xl">
        {[1, 2, 3, 4, 5].map((danger) => (
            <span key={danger} onClick={() => onRate(danger)} className="w-[100px] h-[40px]">
                {danger <= rating ? <div className="text-xl">⚠️</div> : <div className="text-2xl">⚠</div>}
            </span>
        ))}
    </div>
);

const AddIssueOnClickComponent: React.FC<{ setNewIssuePos: any; setShowModal: any }> = ({
    setNewIssuePos,
    setShowModal,
}) => {
    useMapEvents({
        click(e) {
            setNewIssuePos([e.latlng.lat, e.latlng.lng]);
            setShowModal(true);
        },
    });
    return null;
};

const MapPage: React.FC = () => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [clusters, setClusters] = useState<IssueCluster[]>([]);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showWeather, setShowWeather] = useState(true);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [weatherCorrelations, setWeatherCorrelations] = useState<WeatherCorrelation[]>([]);
    const [sortBy, setSortBy] = useState<'severity' | 'distance'>('severity');
    const [newIssuePos, setNewIssuePos] = useState<[number, number] | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newIssueDesc, setNewIssueDesc] = useState('');
    const [newSeverity, setNewSeverity] = useState(1);
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [selectedCluster, setSelectedCluster] = useState<IssueCluster | null>(null);
    const [newIssueTitle, setNewIssueTitle] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [mediaFiles, setMediaFiles] = useState<FileList | null>(null);
    const [similar, setSimilar] = useState<any[]>([]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const currentPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setPosition(currentPos);

                try {
                    const response = await axios.get(`${API}/getAllproblems`);

                    const fetchedIssues = response.data.problems.map((item: any) => ({
                        id: item._id,
                        position: [item.location.coordinates[1], item.location.coordinates[0]],
                        description: item.description,
                        severity: item.averageRating || 1,
                        createdBy: item.createdBy,
                        comments: [],
                        address: item.address,
                        media: item.media || [],
                    }));
                    setIssues(fetchedIssues);
                } catch (error) {
                    console.error("Error fetching issues:", error);
                }
            },
            (err) => {
                console.error(err);
                setPosition([28.6139, 77.2090]);
            }
        );
    }, []);

    // Clustering algorithm for heatmap
    const clusterIssues = (issues: Issue[], clusterRadius: number = 0.001) => {
        const clusters: IssueCluster[] = [];
        const processed = new Set<string>();

        issues.forEach(issue => {
            if (processed.has(issue.id)) return;

            const nearbyIssues = issues.filter(otherIssue => {
                if (processed.has(otherIssue.id)) return false;
                
                const distance = getDistance(
                    issue.position[0], issue.position[1],
                    otherIssue.position[0], otherIssue.position[1]
                );
                
                return distance <= clusterRadius;
            });

            if (nearbyIssues.length > 0) {
                nearbyIssues.forEach(nearbyIssue => processed.add(nearbyIssue.id));

                const avgLat = nearbyIssues.reduce((sum, i) => sum + i.position[0], 0) / nearbyIssues.length;
                const avgLng = nearbyIssues.reduce((sum, i) => sum + i.position[1], 0) / nearbyIssues.length;
                const avgSeverity = nearbyIssues.reduce((sum, i) => sum + i.severity, 0) / nearbyIssues.length;

                clusters.push({
                    id: `cluster-${clusters.length}`,
                    position: [avgLat, avgLng],
                    issues: nearbyIssues,
                    count: nearbyIssues.length,
                    averageSeverity: avgSeverity
                });
            }
        });

        return clusters;
    };

    // Update clusters when issues change
    useEffect(() => {
        if (issues.length > 0) {
            const newClusters = clusterIssues(issues);
            setClusters(newClusters);
        }
    }, [issues]);

    // Weather API integration
    const fetchWeatherData = async (lat: number, lng: number) => {
        try {
            // Using OpenWeatherMap API (free tier)
            const response = await fetch(
                `${WEATHER_CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.UNITS}`
            );
            
            if (response.ok) {
                const data = await response.json();
                const weatherInfo: WeatherData = {
                    temperature: data.main.temp,
                    humidity: data.main.humidity,
                    windSpeed: data.wind.speed,
                    precipitation: data.rain?.['1h'] || 0,
                    condition: data.weather[0].main,
                    icon: data.weather[0].icon,
                    timestamp: new Date().toISOString()
                };
                setWeatherData(weatherInfo);
                analyzeWeatherCorrelations(weatherInfo);
            }
        } catch (error) {
            console.error('Weather API error:', error);
            // Fallback to mock data for demo
            const mockWeather: WeatherData = {
                temperature: 25,
                humidity: 65,
                windSpeed: 12,
                precipitation: 2.5,
                condition: 'Rain',
                icon: '10d',
                timestamp: new Date().toISOString()
            };
            setWeatherData(mockWeather);
            analyzeWeatherCorrelations(mockWeather);
        }
    };

    // Analyze weather-issue correlations
    const analyzeWeatherCorrelations = (weather: WeatherData) => {
        const correlations: WeatherCorrelation[] = [];

        // Rain correlation with drainage issues
        if (weather.precipitation > WEATHER_CONFIG.THRESHOLDS.HEAVY_RAIN) {
            correlations.push({
                issueType: 'Water Supply',
                weatherFactor: 'Heavy Rain',
                correlationStrength: 0.85,
                riskLevel: 'high',
                prediction: 'Expect 40% increase in waterlogging reports'
            });
        }

        // Wind correlation with infrastructure
        if (weather.windSpeed > 15) {
            correlations.push({
                issueType: 'Infrastructure',
                weatherFactor: 'High Winds',
                correlationStrength: 0.72,
                riskLevel: 'medium',
                prediction: 'Potential tree damage and power line issues'
            });
        }

        // Temperature correlation with road issues
        if (weather.temperature > 35) {
            correlations.push({
                issueType: 'Road Issues',
                weatherFactor: 'Extreme Heat',
                correlationStrength: 0.68,
                riskLevel: 'medium',
                prediction: 'Road surface softening may cause new potholes'
            });
        }

        // Humidity correlation with garbage issues
        if (weather.humidity > 80) {
            correlations.push({
                issueType: 'Garbage Collection',
                weatherFactor: 'High Humidity',
                correlationStrength: 0.55,
                riskLevel: 'low',
                prediction: 'Faster waste decomposition, odor complaints likely'
            });
        }

        setWeatherCorrelations(correlations);
    };

    // Fetch weather data when position is available
    useEffect(() => {
        if (position && showWeather) {
            fetchWeatherData(position[0], position[1]);
        }
    }, [position, showWeather]);

    const getComments = async (problemId: string) => {
        try {
            const response = await axios.get(`${API}/getComment/${problemId}`);
            if (response.data.success) {
                return response.data.comments;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    };
    useEffect(() => {
        const fetch = async () => {
            if (selectedIssue) {
                const fetchedComments = await getComments(selectedIssue.id);
                setComments(fetchedComments);
            }
        };

        fetch();
    }, [selectedIssue]);


    const handleAddIssue = async () => {
        if (!newIssueDesc || !newIssuePos) return;

        const userId = localStorage.getItem("id");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
            toast.error("User ID or token not found. Please log in again.");
            return;
        }

        const form = new FormData();
        form.append('title', newIssueTitle || 'Untitled Issue');
        form.append('description', newIssueDesc);
        form.append('category', newCategory || 'General');
        form.append('coordinates', JSON.stringify([newIssuePos[1], newIssuePos[0]]));
        form.append('rating', String(newSeverity));
        form.append('priority', priority);
        if (mediaFiles) {
            Array.from(mediaFiles).slice(0,4).forEach((f) => form.append('media', f));
        }

        try {
            const response = await axios.post(
                `${API}/createProblem/${userId}`,
                form,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const created = response.data.problem;
            toast.success("New Issue is being created")
            setIssues((prev) => [
                ...prev,
                {
                    id: created._id,
                    position: [created.location.coordinates[1], created.location.coordinates[0]],
                    description: created.description,
                    severity: created.averageRating || 1,
                    comments: [],
                    createdBy: created.createdBy,
                    voteCount: created.voteCount || 0,
                    averageRating: created.averageRating || 1,
                },
            ]);

            setNewIssueDesc('');
            setNewSeverity(1);
            setNewComment('');
            setShowModal(false);
            setNewIssuePos(null);
            setMediaFiles(null);
            setSimilar([]);
        } catch (error) {
            console.error("Error adding issue:", error);
            toast.error("Failed to create issue. Please try again.");
        }
    };

    const checkSimilar = async (title: string, desc: string) => {
        if (!newIssuePos) return;
        try {
            const params = new URLSearchParams({
                lat: String(newIssuePos[0]),
                lng: String(newIssuePos[1]),
                text: `${title} ${desc}`
            });
            const res = await axios.get(`${API}/similar?${params.toString()}`);
            if (res.data.success) setSimilar(res.data.similar);
        } catch (e) {}
    }







    const handleDeleteIssue = async (problemId: string) => {
        const userId = localStorage.getItem("id");
        if (!userId) {
            toast.error("User not found. Please log in.");
            return;
        }

        const confirmToast = toast(
            (t) => (
                <div>
                    <p>Are you sure you want to delete this issue?</p>
                    <div>
                        <button
                            onClick={() => handleConfirmDelete(t.id, problemId, userId)}
                            className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-700"
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="bg-gray-500 text-white py-1 px-2 rounded hover:bg-gray-700 ml-2"
                        >
                            No
                        </button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
                position: 'top-center',
                style: { background: '#333', color: 'white', padding: '10px' },
            }
        );
    };

    const handleConfirmDelete = async (toastId: string, problemId: string, userId: string) => {
        try {
            await axios.delete(`${API}/problem/${problemId}/user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setIssues((prev) => prev.filter((issue) => issue.id !== problemId));
            toast.dismiss(toastId);
            toast.success("Issue deleted successfully.");
        } catch (err) {
            console.error("Delete error:", err);
            toast.dismiss(toastId);
            toast.error("Failed to delete issue. Please try again.");
        }
    };


    const handleAddComment = async (issueId: string) => {
        const userId = localStorage.getItem("id");
        const token = localStorage.getItem("token");

        if (!newComment.trim()) return;
        if (!userId || !token) {
            toast.error("User not authenticated");
            return;
        }

        try {
            const response = await axios.post(
                `${API}/addComment/${issueId}/${userId}`,
                { comment: newComment },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const addedComment = response.data.comment.comment;
            toast.success("Comment has been added successfully")
            setIssues((prev) =>
                prev.map((issue) =>
                    issue.id === issueId
                        ? { ...issue, comments: [...issue.comments, addedComment] }
                        : issue
                )
            );

            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("Failed to add comment. Please try again.");
        }
    };

    const handleRateIssue = async (issueId: string, rating: number) => {
        const userId = localStorage.getItem("id");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
            toast.error("Please log in to rate an issue.");
            return;
        }

        try {
            const res = await axios.post(
                `${API}/problems/${issueId}/rate/${userId}`,
                { rating },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data.success) {
                setIssues((prev) =>
                    prev.map((issue) =>
                        issue.id === issueId
                            ? {
                                ...issue,
                                voteCount: (issue.voteCount || 0) + (rating >= 3 ? 1 : 0),
                                averageRating: parseFloat(res.data.updatedAverage || rating),
                            }
                            : issue
                    )
                );
                toast.success("Rating submitted successfully!");
                window.location.reload();
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || "Error rating issue.";
            toast.error(msg);
            console.error(err);
        }
    };


    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (x: number) => (x * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const sortedIssues = [...issues].sort((a, b) => {
        if (sortBy === 'severity') return b.severity - a.severity;
        if (position) {
            const distA = getDistance(position[0], position[1], a.position[0], a.position[1]);
            const distB = getDistance(position[0], position[1], b.position[0], b.position[1]);
            return distA - distB;
        }
        return 0;
    });

    // Helper functions for heatmap visualization
    const getCircleRadius = (count: number) => {
        return Math.min(50 + (count * 20), 200); // Base radius 50, increases with count
    };

    const getCircleColor = (count: number, severity: number) => {
        const intensity = Math.min(count / 10, 1); // Normalize intensity
        const severityFactor = severity / 5; // Normalize severity (1-5 scale)
        
        // Red color with varying opacity based on count and severity
        const opacity = Math.max(0.3, intensity * severityFactor);
        return `rgba(220, 38, 38, ${opacity})`;
    };

    const getCircleWeight = (count: number) => {
        return Math.min(2 + count, 8); // Border weight increases with count
    };

    return (
        <div className="min-h-screen bg-[#f9f9f9] p-4 relative">
            <h1 className="text-3xl font-bold text-center font-serif mb-6">Civic Issue Map</h1>

            {position ? (
                <>
                    {/* Controls Panel */}
                    <div className="flex justify-center mb-4 space-x-4">
                        {/* Heatmap Toggle Control */}
                        <div className="bg-white rounded-lg shadow-md p-3 flex items-center space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showHeatmap}
                                    onChange={(e) => setShowHeatmap(e.target.checked)}
                                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Show Issue Heatmap</span>
                            </label>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <div className="w-3 h-3 bg-red-500 rounded-full opacity-30"></div>
                                <span>Low Density</span>
                                <div className="w-3 h-3 bg-red-500 rounded-full opacity-70"></div>
                                <span>High Density</span>
                            </div>
                        </div>

                        {/* Weather Widget */}
                        {weatherData && (
                            <div className="bg-white rounded-lg shadow-md p-3 flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <img 
                                        src={`https://openweathermap.org/img/w/${weatherData.icon}.png`}
                                        alt={weatherData.condition}
                                        className="w-8 h-8"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-gray-700">
                                            {weatherData.temperature}°C - {weatherData.condition}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            💧 {weatherData.precipitation}mm | 💨 {weatherData.windSpeed}km/h
                                        </div>
                                    </div>
                                </div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showWeather}
                                        onChange={(e) => setShowWeather(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-600">Weather Analysis</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Weather Correlations Alert */}
                    {showWeather && weatherCorrelations.length > 0 && (
                        <div className="max-w-4xl mx-auto mb-4">
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <span className="text-2xl">⚠️</span>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h3 className="text-sm font-medium text-yellow-800 mb-2">
                                            Weather-Related Issue Predictions
                                        </h3>
                                        <div className="space-y-2">
                                            {weatherCorrelations.map((correlation, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                                    <div className="flex-1">
                                                        <span className="text-sm font-medium text-gray-800">
                                                            {correlation.issueType}
                                                        </span>
                                                        <span className="text-xs text-gray-600 ml-2">
                                                            ({correlation.weatherFactor})
                                                        </span>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {correlation.prediction}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            correlation.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                                                            correlation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                            {correlation.riskLevel.toUpperCase()}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {Math.round(correlation.correlationStrength * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <MapContainer
                        center={position}
                        zoom={13}
                        scrollWheelZoom
                        className="w-full h-[600px] rounded-lg shadow-lg mb-8 z-0"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <AddIssueOnClickComponent setNewIssuePos={setNewIssuePos} setShowModal={setShowModal} />
                        <Marker position={position} icon={liveLocationIcon}>
                            <Popup>You are here</Popup>
                        </Marker>

                        {/* Heatmap Circles */}
                        {showHeatmap && clusters.map((cluster) => (
                            <Circle
                                key={cluster.id}
                                center={cluster.position}
                                radius={getCircleRadius(cluster.count)}
                                pathOptions={{
                                    color: '#dc2626',
                                    fillColor: getCircleColor(cluster.count, cluster.averageSeverity),
                                    fillOpacity: 0.6,
                                    weight: getCircleWeight(cluster.count),
                                }}
                                eventHandlers={{
                                    click: () => setSelectedCluster(cluster),
                                }}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <h3 className="font-bold text-lg text-red-600 mb-2">
                                            Issue Cluster ({cluster.count} issues)
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Average Severity: {cluster.averageSeverity.toFixed(1)}/5
                                        </p>
                                        <button
                                            onClick={() => setSelectedCluster(cluster)}
                                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                        >
                                            View All Issues
                                        </button>
                                    </div>
                                </Popup>
                            </Circle>
                        ))}

                        {/* Individual Issue Markers (only show when heatmap is off or for single issues) */}
                        {(!showHeatmap || clusters.length === 0) && issues.map((issue) => (
                            <Marker key={issue.id} position={issue.position} icon={issueIcon}>
                                <Popup>
                                    <div className="text-lg">
                                        <p className="text-gray-700 mb-2">
                                            <span className="font-semibold text-black">Description:</span> {issue.description}
                                        </p>

                                        <p className="mt-1 text-gray-700">
                                            <span className="font-semibold text-black">Severity:</span> {issue.severity}
                                        </p>
                                        {issue.address && (
                                            <p className="mt-1 text-gray-700">
                                                <span className="font-semibold text-black">Address:</span> {issue.address}
                                            </p>
                                        )}
                                        {issue.media && issue.media.length > 0 && (
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {issue.media.map((m, idx) => (
                                                    <img key={idx} src={`${API.replace('/api/v1/users','')}${m}`} alt="evidence" className="w-32 h-24 object-cover rounded" />
                                                ))}
                                            </div>
                                        )}

                                        <DangerRating
                                            rating={issue.severity}
                                            onRate={(rating) => {
                                                setIssues((prev) =>
                                                    prev.map((i) =>
                                                        i.id === issue.id ? { ...i, severity: rating } : i
                                                    )
                                                );
                                            }}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 mt-2">
                                        <span className="text-gray-600">Add a Comment:</span>
                                        <textarea
                                            className="p-2 border border-gray-300 rounded"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            cols={40}
                                            rows={3}
                                        />
                                        <button
                                            onClick={() => handleAddComment(issue.id)}
                                            className="bg-blue-500 text-white px-3 py-1 rounded"
                                        >
                                            Add Comment
                                        </button>
                                        <button
                                            onClick={() => setSelectedIssue(issue)}
                                            className="bg-green-500 text-white px-3 py-1 rounded mt-2"
                                        >
                                            All Comments
                                        </button>

                                        {issue.createdBy !== localStorage.getItem("id") && (
                                            <div className="mt-2">
                                                <p className="font-medium mb-1">Rate this issue:</p>
                                                <DangerRating
                                                    rating={0}
                                                    onRate={(value) => handleRateIssue(issue.id, value)}
                                                />
                                            </div>
                                        )}


                                        {issue.createdBy?.toString() === localStorage.getItem("id")?.toString() && (
                                            <button
                                                onClick={() => handleDeleteIssue(issue.id)}
                                                className="bg-red-600 text-white px-3 py-1 rounded mt-2 hover:bg-red-700"
                                            >
                                                Delete Issue
                                            </button>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                    </MapContainer>

                    {/* Table */}
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-end mb-4">
                            <label className="text-sm font-medium mr-2">Sort by:</label>
                            <select
                                className="border border-gray-300 rounded px-3 py-1 text-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'severity' | 'distance')}
                            >
                                <option value="severity">Severity</option>
                                <option value="distance">Distance</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto rounded-lg shadow">
                            <table className="min-w-full text-sm text-left text-gray-700 bg-white">
                                <thead className="bg-gray-200 uppercase text-xs tracking-wider text-gray-600">
                                    <tr>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3">Severity</th>
                                        <th className="px-6 py-3">Distance (km)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedIssues.map((issue) => {
                                        const dist = position
                                            ? getDistance(position[0], position[1], issue.position[0], issue.position[1])
                                            : 0;
                                        return (
                                            <tr key={issue.id} className="hover:bg-blue-50">
                                                <td className="px-6 py-4">{issue.description}</td>
                                                <td className="px-6 py-4">{issue.severity}</td>
                                                <td className="px-6 py-4">{dist.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-center text-gray-600">Fetching your location...</p>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Report New Issue</h2>

                        <input
                            type="text"
                            placeholder="Enter issue title..."
                            value={newIssueTitle}
                            onChange={(e) => { setNewIssueTitle(e.target.value); checkSimilar(e.target.value, newIssueDesc); }}
                            className="w-full border rounded px-3 py-2 mb-4"
                        />

                        <input
                            type="text"
                            placeholder="Enter issue description..."
                            value={newIssueDesc}
                            onChange={(e) => { setNewIssueDesc(e.target.value); checkSimilar(newIssueTitle, e.target.value); }}
                            className="w-full border rounded px-3 py-2 mb-4"
                        />

                        <div className="mb-4">
                            <p className="mb-1 font-medium">Category:</p>
                            <select
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">Select a category</option>
                                <option value="Road">Road</option>
                                <option value="Sanitation">Sanitation</option>
                                <option value="Electricity">Electricity</option>
                                <option value="Water Supply">Water Supply</option>
                                <option value="Garbage">Garbage</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <p className="mb-1 font-medium">Priority:</p>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as 'low'|'medium'|'high')}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <p className="mb-1 font-medium">Attach photos (up to 4):</p>
                            <input type="file" accept="image/*" multiple onChange={(e) => setMediaFiles(e.target.files)} />
                        </div>

                        {similar.length > 0 && (
                            <div className="mb-4 border rounded p-3 bg-yellow-50">
                                <p className="font-medium mb-2">Similar nearby reports:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    {similar.map((s) => (
                                        <li key={s._id}>{s.title} — {s.category}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mb-4">
                            <p className="mb-1 font-medium">Rate Severity:</p>
                            <DangerRating rating={newSeverity} onRate={setNewSeverity} />
                        </div>

                        <div className="mb-4">
                            <p className="mb-1 font-medium">Add a Comment:</p>
                            <textarea
                                className="p-2 border border-gray-300 rounded"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                cols={40}
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddIssue}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Add Issue
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {selectedIssue && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md h-[80%] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg text-gray-700 font-semibold">Description:</h2>
                                <p className="text-xl">{selectedIssue.description}</p>
                            </div>
                            <button
                                onClick={() => setSelectedIssue(null)}
                                className="text-2xl text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-3">
                            {comments.length > 0 ? (
                                comments.map((comment, index) => (
                                    <div key={index} className="p-2 border-b">{comment.comment}</div>
                                ))
                            ) : (
                                <div>No comments yet.</div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* Cluster Details Modal */}
            {selectedCluster && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl h-[80%] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-red-600">
                                    Issue Cluster - {selectedCluster.count} Issues
                                </h2>
                                <p className="text-gray-600">
                                    Average Severity: {selectedCluster.averageSeverity.toFixed(1)}/5
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedCluster(null)}
                                className="text-2xl text-gray-600 hover:text-gray-800"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="grid gap-4">
                            {selectedCluster.issues.map((issue, index) => (
                                <div key={issue.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">Issue #{index + 1}</h3>
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                                            Severity: {issue.severity}/5
                                        </span>
                                    </div>
                                    
                                    <p className="text-gray-700 mb-2">
                                        <span className="font-medium">Description:</span> {issue.description}
                                    </p>
                                    
                                    {issue.address && (
                                        <p className="text-gray-600 mb-2">
                                            <span className="font-medium">Address:</span> {issue.address}
                                        </p>
                                    )}
                                    
                                    <div className="flex justify-between items-center text-sm text-gray-500">
                                        <span>Votes: {issue.voteCount || 0}</span>
                                        <span>Rating: {issue.averageRating || 'N/A'}</span>
                                    </div>
                                    
                                    {issue.media && issue.media.length > 0 && (
                                        <div className="mt-3 grid grid-cols-4 gap-2">
                                            {issue.media.slice(0, 4).map((media, idx) => (
                                                <img 
                                                    key={idx} 
                                                    src={`${API.replace('/api/v1/users','')}${media}`} 
                                                    alt="Issue evidence" 
                                                    className="w-full h-20 object-cover rounded"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    
                                    <div className="mt-3 flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedIssue(issue);
                                                setSelectedCluster(null);
                                            }}
                                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                        >
                                            View Details
                                        </button>
                                        
                                        {issue.createdBy !== localStorage.getItem("id") && (
                                            <button
                                                onClick={() => {
                                                    setSelectedCluster(null);
                                                    setSelectedIssue(issue);
                                                }}
                                                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                            >
                                                Rate Issue
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;