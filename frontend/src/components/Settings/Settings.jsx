import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Users, Building2, Bell, Shield, Activity, Wifi, Palette } from 'lucide-react';
import UsersManagement from './Users/Users';
import AuditLog from './AuditLog';
import GeneralSettings from './GeneralSettings';
import NotificationsSettings from './NotificationsSettings';
import BackupsSettings from './BackupsSettings';
import AppearanceSettings from './AppearanceSettings';
import NetworkSettings from './NetworkSettings';

const navItems = [
    { to: 'usuarios', icon: Users, label: 'Usuarios del Sistema' },
    { to: 'general', icon: Building2, label: 'Datos del Gimnasio' },
    { to: 'red', icon: Wifi, label: 'Configuración de Red' },
    { to: 'notificaciones', icon: Bell, label: 'Notificaciones' },
    { to: 'seguridad', icon: Shield, label: 'Seguridad y Backups' },
    { to: 'apariencia', icon: Palette, label: 'Apariencia y Otros' },
    { to: 'actividad', icon: Activity, label: 'Registro de Actividad' },
];

const Settings = () => {
    return (
        <div className="flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[600px] overflow-hidden transition-colors duration-200">
            {/* Submenu Sidebar */}
            <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-800 dark:text-white">Configuración</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestión del sistema</p>
                </div>

                <nav className="p-2 space-y-1">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={`/configuracion/${item.to}`}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${isActive ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}
                            `}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
                <Routes>
                    <Route path="/" element={<Navigate to="usuarios" replace />} />
                    <Route path="usuarios" element={<UsersManagement />} />
                    <Route path="general" element={<GeneralSettings />} />
                    <Route path="red" element={<NetworkSettings />} />
                    <Route path="notificaciones" element={<NotificationsSettings />} />
                    <Route path="seguridad" element={<BackupsSettings />} />
                    <Route path="apariencia" element={<AppearanceSettings />} />
                    <Route path="actividad" element={<AuditLog />} />
                </Routes>
            </div>
        </div>
    );
};

export default Settings;
