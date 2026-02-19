import { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Users, Database, Bell, Shield, Activity } from 'lucide-react';
import UsersManagement from './Users/Users';
import AuditLog from './AuditLog';

const Settings = () => {
    return (
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] overflow-hidden">
            {/* Submenu Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">Configuración</h2>
                    <p className="text-sm text-gray-500">Gestión del sistema</p>
                </div>

                <nav className="p-2 space-y-1">
                    <NavLink
                        to="/configuracion/usuarios"
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            `}
                    >
                        <Users className="w-4 h-4" />
                        Usuarios del Sistema
                    </NavLink>

                    <NavLink
                        to="/configuracion/general"
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            `}
                    >
                        <Database className="w-4 h-4" />
                        Datos del Gimnasio
                    </NavLink>

                    <NavLink
                        to="/configuracion/notificaciones"
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            `}
                    >
                        <Bell className="w-4 h-4" />
                        Notificaciones
                    </NavLink>

                    <NavLink
                        to="/configuracion/seguridad"
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            `}
                    >
                        <Shield className="w-4 h-4" />
                        Seguridad y Backups
                    </NavLink>

                    <NavLink
                        to="/configuracion/actividad"
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            `}
                    >
                        <Activity className="w-4 h-4" />
                        Registro de Actividad
                    </NavLink>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
                <Routes>
                    <Route path="/" element={<Navigate to="usuarios" replace />} />
                    <Route path="usuarios" element={<UsersManagement />} />
                    <Route path="general" element={<div className="p-8 text-center text-gray-500">Configuración General (Próximamente)</div>} />
                    <Route path="notificaciones" element={<div className="p-8 text-center text-gray-500">Configuración de Notificaciones (Próximamente)</div>} />
                    <Route path="seguridad" element={<div className="p-8 text-center text-gray-500">Seguridad y Backups (Próximamente)</div>} />
                    <Route path="actividad" element={<AuditLog />} />
                </Routes>
            </div>
        </div>
    );
};

export default Settings;
