import React, { createElement, useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { API } from '../ApiUri';

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
    const [sortBy, setSortBy] = useState<'severity' | 'distance'>('severity');
    const [newIssuePos, setNewIssuePos] = useState<[number, number] | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newIssueDesc, setNewIssueDesc] = useState('');
    const [newSeverity, setNewSeverity] = useState(1);
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
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

    return (
        <div className="min-h-screen bg-[#f9f9f9] p-4 relative">
            <h1 className="text-3xl font-bold text-center font-serif mb-6">Civic Issue Map</h1>

            {position ? (
                <>
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
                        {issues.map((issue) => (
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
        </div>
    );
};

export default MapPage;