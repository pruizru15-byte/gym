import { useState, useEffect } from 'react';
import { X, Save, Shield, User, Mail, Lock } from 'lucide-react';
import api from '../../../services/api';

const UserForm = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        username: '',
        email: '',
        rol: 'recepcion',
        password: '',
        activo: 1
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                nombre: user.nombre || '',
                username: user.username || '',
                email: user.email || '',
                rol: user.rol || 'recepcion',
                password: '', // Password is not populated for security
                activo: user.activo ?? 1
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (user) {
                // Update
                const dataToSend = { ...formData };
                if (!dataToSend.password) delete dataToSend.password; // Don't send empty password

                await api.put(`/usuarios/${user.id}`, dataToSend);
            } else {
                // Create
                await api.post('/usuarios', formData);
            }
            onSuccess();
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err.response?.data?.error || 'Error al guardar el usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-lg text-gray-800">
                        {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="nombre"
                                required
                                value={formData.nombre}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Juan Pérez"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="username"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                placeholder="juanperez"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opcional)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                placeholder="juan@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                name="rol"
                                value={formData.rol}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 appearance-none"
                            >
                                <option value="recepcion">Recepción</option>
                                <option value="cajero">Cajero</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {user ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                name="password"
                                required={!user}
                                minLength={6}
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                placeholder="••••••"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                    </div>

                    {user && (
                        <div className="flex items-center gap-2 mt-4">
                            <input
                                type="checkbox"
                                id="activo"
                                name="activo"
                                checked={formData.activo === 1}
                                onChange={handleChange}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="activo" className="text-sm text-gray-700 font-medium">Usuario Activo</label>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex-1"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-b-transparent rounded-full"></span> : <Save className="w-4 h-4" />}
                            {user ? 'Guardar Cambios' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
