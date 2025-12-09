import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { Plus, Trash2, RotateCcw, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingComponent from '../components/LoadingComponent';
import CustomSelect from '../components/CustomSelect';
import NotificationToast from '../components/NotificationToast';
import ConfirmationModal from '../components/ConfirmationModal';

const ManagerAgents = () => {
    const { user } = useAuth();
    const [agents, setAgents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'AGENT' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [breakTypes, setBreakTypes] = useState([]);
    const [selectedBreaks, setSelectedBreaks] = useState([]);
    const [toast, setToast] = useState({ message: '', type: 'success', isOpen: false });
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => { }
    });

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const [usersRes, breaksRes] = await Promise.all([
                api.get('/users'),
                api.get('/breaks/types')
            ]);
            setAgents(usersRes.data);
            setBreakTypes(breaksRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentName = formData.name; // Capture name for notification
        try {
            if (editingId) {
                await api.put(`/users/${editingId}`, { ...formData, assignedBreaks: selectedBreaks });
                setToast({
                    isOpen: true,
                    message: `Agent ${currentName} updated successfully`,
                    type: 'success'
                });
            } else {
                await api.post('/users', { ...formData, assignedBreaks: selectedBreaks });
                setToast({
                    isOpen: true,
                    message: `Agent ${currentName} was created successfully with temporary password 'meta@147'`,
                    type: 'success'
                });
            }
            setIsModalOpen(false);
            setFormData({ name: '', email: '', role: 'AGENT' });
            setSelectedBreaks([]);
            setEditingId(null);
            fetchAgents();
        } catch (error) {
            setToast({
                isOpen: true,
                message: error.response?.data?.message || 'Failed to save user',
                type: 'error'
            });
        }
    };

    const handleDelete = (id) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/users/${id}`);
                    setToast({
                        isOpen: true,
                        message: 'User deleted successfully',
                        type: 'success'
                    });
                    fetchAgents();
                } catch (error) {
                    console.error(error);
                    setToast({
                        isOpen: true,
                        message: 'Failed to delete user',
                        type: 'error'
                    });
                }
            }
        });
    };

    const handleResetPassword = (id) => {
        const agent = agents.find(a => a.id === id);
        setConfirmation({
            isOpen: true,
            title: 'Reset Password',
            message: `Are you sure you want to reset the password for ${agent?.name} to default (meta@147)?`,
            type: 'warning',
            confirmText: 'Reset Password',
            onConfirm: async () => {
                try {
                    await api.put(`/users/${id}/reset-password`);
                    setToast({
                        isOpen: true,
                        message: `Agent ${agent?.name}'s password was successfully reset to temporary password 'meta@147'`,
                        type: 'success'
                    });
                } catch (error) {
                    console.error(error);
                    setToast({
                        isOpen: true,
                        message: 'Failed to reset password',
                        type: 'error'
                    });
                }
            }
        });
    };

    const handleEdit = (agent) => {
        setFormData({ name: agent.name, email: agent.email, role: agent.role });
        setEditingId(agent.id);


        if (agent.allowedBreaks && agent.allowedBreaks.length > 0) {
            setSelectedBreaks(agent.allowedBreaks.map(b => b.id));
        } else {
            // Default to all active breaks if none explicitly assigned (Legacy support)
            setSelectedBreaks(breakTypes.map(b => b.id));
        }
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setFormData({ name: '', email: '', role: 'AGENT' });
        setEditingId(null);
        setSelectedBreaks(breakTypes.map(b => b.id)); // Default to all breaks for new user
        setIsModalOpen(true);
    };



    if (loading) return <LoadingComponent message="Loading users..." />;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Users</h2>
                {user.role !== 'ADMIN' && (
                    <button
                        onClick={openAddModal}
                        className="bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800"
                    >
                        <Plus size={20} />
                        Add User
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>

                                <th className="p-4 text-gray-600 font-medium">Name</th>
                                <th className="p-4 text-gray-600 font-medium">Email</th>
                                <th className="p-4 text-gray-600 font-medium">Role</th>
                                <th className="p-4 text-gray-600 font-medium">Created By</th>
                                <th className="p-4 text-gray-600 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map(agent => (
                                <tr key={agent.id} className="border-b last:border-0 hover:bg-gray-50">

                                    <td className="p-4 font-medium">{agent.name}</td>
                                    <td className="p-4 text-gray-600">{agent.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${agent.role === 'SUPER_ADMIN' || agent.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                                            agent.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {agent.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{agent.createdBy?.name || '-'}</td>
                                    <td className="p-4">
                                        {user.role !== 'ADMIN' && (
                                            <>
                                                <button
                                                    onClick={() => handleResetPassword(agent.id)}
                                                    className="text-blue-500 hover:text-blue-700 p-2"
                                                    title="Reset Password"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(agent)}
                                                    className="text-gray-500 hover:text-gray-700 p-2"
                                                    title="Edit User"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(agent.id)}
                                                    className="text-red-500 hover:text-red-700 p-2"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit User" : "Add New User"}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>

                    {user.role === 'SUPER_ADMIN' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <CustomSelect
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                options={[
                                    { value: 'AGENT', label: 'Agent' },
                                    { value: 'MANAGER', label: 'Manager' },
                                    { value: 'ADMIN', label: 'Admin' }
                                ]}
                            />
                        </div>
                    )}

                    {formData.role === 'AGENT' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Breaks</label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                                {breakTypes.map(bt => {
                                    const isSelected = selectedBreaks.includes(bt.id);
                                    return (
                                        <button
                                            key={bt.id}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedBreaks(selectedBreaks.filter(id => id !== bt.id));
                                                } else {
                                                    setSelectedBreaks([...selectedBreaks, bt.id]);
                                                }
                                            }}
                                            className={`
                                                px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                                                ${isSelected
                                                    ? 'bg-blue-600/90 text-white shadow-md backdrop-blur-sm border-blue-500 hover:bg-blue-600'
                                                    : 'bg-gray-100/50 text-gray-500 border-gray-200 hover:bg-gray-200/80 hover:text-gray-700'
                                                }
                                            `}
                                        >
                                            {bt.name}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-end mt-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedBreaks(breakTypes.map(b => b.id))}
                                    className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedBreaks([])}
                                    className="px-3 py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800"
                    >
                        {editingId ? "Update User" : "Add User"}
                    </button>
                </form>
            </Modal>

            {toast.isOpen && (
                <NotificationToast
                    message={toast.message}
                    type={toast.type}
                    duration={3000}
                    onClose={() => setToast({ ...toast, isOpen: false })}
                />
            )}

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                type={confirmation.type}
                confirmText={confirmation.confirmText}
            />
        </div >
    );


};

export default ManagerAgents;
