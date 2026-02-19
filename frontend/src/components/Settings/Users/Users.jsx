import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import UserForm from './UserForm';
import { useAuth } from '../../../hooks/useAuth';

const UsersManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/usuarios');
            setUsers(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Error al cargar los usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas desactivar este usuario?')) return;

        try {
            await api.delete(`/usuarios/${id}`);
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Error al eliminar el usuario');
        }
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        fetchUsers();
    };

    // Filter users
    const filteredUsers = users.filter(user =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-purple-100 text-purple-800',
            recepcion: 'bg-blue-100 text-blue-800',
            cajero: 'bg-green-100 text-green-800'
        };

        const labels = {
            admin: 'Administrador',
            recepcion: 'Recepción',
            cajero: 'Cajero'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
                {labels[role] || role}
            </span>
        );
    };

    if (loading) return <div className="p-8 text-center">Cargando usuarios...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Usuarios del Sistema</h2>
                    <p className="text-sm text-gray-500">Gestiona los accesos y roles del personal</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Usuario
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Search and Filter */}
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder="Buscar por nombre o usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                            {user.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                                            <div className="text-sm text-gray-500">@{user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getRoleBadge(user.rol)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {user.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-primary-600 hover:text-primary-900 p-1 hover:bg-primary-50 rounded"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {user.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <UserForm
                    user={editingUser}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};

export default UsersManagement;
