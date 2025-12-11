import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Timer from '../components/Timer';
import ChangePasswordModal from '../components/ChangePasswordModal';
import Layout from '../components/Layout';
import LoadingComponent from '../components/LoadingComponent';
import NotificationToast from '../components/NotificationToast';
import { Coffee, Utensils, Zap, Clock, PlayCircle, ArrowLeft } from 'lucide-react';


const UserDashboard = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [breakTypes, setBreakTypes] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'success', isOpen: false });

    useEffect(() => {
        if (user?.mustChangePassword) {
            setIsChangePasswordOpen(true);
        }
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [typesRes, historyRes] = await Promise.all([
                api.get('/breaks/types'),
                api.get('/breaks/history')
            ]);
            setBreakTypes(typesRes.data);
            setHistory(historyRes.data);

            // Check for ongoing session in history (or separate endpoint)
            const ongoing = historyRes.data.find(s => s.status === 'ONGOING');
            if (ongoing) {
                setCurrentSession(ongoing);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const startBreak = async (breakTypeId) => {
        try {
            const res = await api.post('/breaks/start', { breakTypeId });
            setCurrentSession(res.data);
            fetchData(); // Refresh history
        } catch (error) {
            setToast({
                isOpen: true,
                message: error.response?.data?.message || 'Failed to start break',
                type: 'error'
            });
        }
    };

    const formatDurationHMS = (seconds) => {
        if (!seconds || seconds <= 0) return '0s';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 || parts.length === 0) parts.push(`${s}s`);
        return parts.join(' ');
    };

    const endBreak = async () => {
        const previousSession = currentSession;
        setCurrentSession(null); // Optimistic update

        try {
            await api.post('/breaks/end');
            fetchData();
        } catch (error) {
            setCurrentSession(previousSession); // Revert on failure
            setToast({
                isOpen: true,
                message: "Failed to end break. Please try again.",
                type: 'error'
            });
        }
    };

    const navLinks = (
        <>
            <button
                onClick={() => navigate('/dashboard')}
                className="block w-full text-left py-2 px-4 bg-blue-800 rounded mb-2 transition hover:bg-blue-700"
            >
                Start / End Breaks
            </button>
            <button
                onClick={() => navigate('/history')}
                className="block w-full text-left py-2 px-4 hover:bg-blue-800 rounded mb-2 transition"
            >
                History
            </button>
            {user.role === 'ADMIN' && (
                <button
                    onClick={() => navigate('/manager')}
                    className="flex items-center gap-2 w-full text-left py-2 px-4 hover:bg-blue-800 rounded mb-2 transition"
                >
                    <ArrowLeft size={18} />
                    <span>Admin Dashboard</span>
                </button>
            )}
        </>
    );

    return (
        <Layout navLinks={navLinks}>
            <div className="p-4 md:p-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Start / End Breaks</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">Welcome,</span>
                        <span className="font-bold">{user?.name}</span>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <LoadingComponent message="Loading dashboard..." />
                    </div>
                ) : (
                    <>
                        {/* Active Break Section */}
                        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-lg font-semibold">Current Status</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentSession
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                    }`}>
                                    {currentSession ? 'On-Break' : 'Online'}
                                </span>
                            </div>
                            {currentSession ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-2">You are on a</p>
                                    <h2 className="text-3xl font-bold text-blue-900 mb-4">{currentSession.breakType.name}</h2>
                                    <div className="mb-8">
                                        <Timer
                                            startTime={currentSession.startTime}
                                            expectedEndTime={currentSession.expectedEndTime}
                                            status={currentSession.status}
                                            large={true}
                                        />
                                    </div>
                                    <button
                                        onClick={endBreak}
                                        className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
                                    >
                                        End Break
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-600 mb-4 font-medium">Select a break type to start:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                        {breakTypes.map(type => {
                                            const getIcon = (name) => {
                                                const lower = name.toLowerCase();
                                                if (lower.includes('lunch') || lower.includes('dinner') || lower.includes('food')) return <Utensils size={32} className="text-orange-500" />;
                                                if (lower.includes('tea') || lower.includes('coffee')) return <Coffee size={32} className="text-amber-700" />;
                                                if (lower.includes('short') || lower.includes('bio')) return <Zap size={32} className="text-yellow-500" />;
                                                return <Clock size={32} className="text-blue-500" />;
                                            };

                                            return (
                                                <button
                                                    key={type.id}
                                                    onClick={() => startBreak(type.id)}
                                                    className="group relative bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 text-left overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <PlayCircle className="text-blue-600" size={24} />
                                                    </div>

                                                    <div className="mb-4 p-3 bg-gray-50 rounded-full w-fit group-hover:bg-blue-50 transition-colors">
                                                        {getIcon(type.name)}
                                                    </div>

                                                    <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-800 transition-colors">
                                                        {type.name}
                                                    </h4>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {formatDurationHMS(type.duration)}
                                                        </span>
                                                    </div>

                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* History Section */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">Recent Breaks</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="pb-3 text-gray-600 whitespace-nowrap px-2">Type</th>
                                            <th className="pb-3 text-gray-600 whitespace-nowrap px-2">Start Time</th>
                                            <th className="pb-3 text-gray-600 whitespace-nowrap px-2">End Time</th>
                                            <th className="pb-3 text-gray-600 whitespace-nowrap px-2">Status</th>
                                            <th className="pb-3 text-gray-600 whitespace-nowrap px-2">Violation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.slice(0, 5).map(session => (
                                            <tr key={session.id} className="border-b last:border-0">
                                                <td className="py-3 px-2 whitespace-nowrap">{session.breakType.name}</td>
                                                <td className="py-3 px-2 whitespace-nowrap">{new Date(session.startTime).toLocaleTimeString()}</td>
                                                <td className="py-3 px-2 whitespace-nowrap">{session.endTime ? new Date(session.endTime).toLocaleTimeString() : '-'}</td>
                                                <td className="py-3 px-2 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded text-xs ${session.status === 'ONGOING' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {session.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-red-500 whitespace-nowrap">
                                                    {session.violationDuration ? `+${formatDurationHMS(session.violationDuration)}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                    </>
                )}
            </div>

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
                forceChange={user?.mustChangePassword}
                onSubmit={() => {
                    updateUser({ ...user, mustChangePassword: false });
                    setIsChangePasswordOpen(false);
                }}
            />

            {toast.isOpen && (
                <NotificationToast
                    message={toast.message}
                    type={toast.type}
                    duration={3000}
                    onClose={() => setToast({ ...toast, isOpen: false })}
                />
            )}
        </Layout>
    );
};

export default UserDashboard;
