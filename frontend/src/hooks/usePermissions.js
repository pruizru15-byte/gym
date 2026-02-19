import { useAuth } from './useAuth';

export const PERMISSIONS = {
    CAN_MANAGE_USERS: 'CAN_MANAGE_USERS',
    CAN_MANAGE_CLIENTS: 'CAN_MANAGE_CLIENTS', // Create, Edit, Delete
    CAN_VIEW_CLIENTS: 'CAN_VIEW_CLIENTS',
    CAN_CHECK_IN: 'CAN_CHECK_IN',
    CAN_RENEW_MEMBERSHIP: 'CAN_RENEW_MEMBERSHIP',
    CAN_POS: 'CAN_POS',
    CAN_MANAGE_INVENTORY: 'CAN_MANAGE_INVENTORY', // Products
    CAN_VIEW_FINANCIALS: 'CAN_VIEW_FINANCIALS',
    CAN_CONFIGURE_SYSTEM: 'CAN_CONFIGURE_SYSTEM',
    CAN_MANAGE_MACHINES: 'CAN_MANAGE_MACHINES',
};

export const ROLES = {
    ADMIN: 'admin',
    RECEPCION: 'recepcion',
    CAJERO: 'cajero',
};

const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        PERMISSIONS.CAN_MANAGE_USERS,
        PERMISSIONS.CAN_MANAGE_CLIENTS,
        PERMISSIONS.CAN_VIEW_CLIENTS,
        PERMISSIONS.CAN_CHECK_IN,
        PERMISSIONS.CAN_RENEW_MEMBERSHIP,
        PERMISSIONS.CAN_POS,
        PERMISSIONS.CAN_MANAGE_INVENTORY,
        PERMISSIONS.CAN_VIEW_FINANCIALS,
        PERMISSIONS.CAN_CONFIGURE_SYSTEM,
        PERMISSIONS.CAN_MANAGE_MACHINES,
    ],
    [ROLES.RECEPCION]: [
        PERMISSIONS.CAN_MANAGE_CLIENTS,
        PERMISSIONS.CAN_VIEW_CLIENTS,
        PERMISSIONS.CAN_CHECK_IN,
        PERMISSIONS.CAN_RENEW_MEMBERSHIP,
        PERMISSIONS.CAN_POS,
    ],
    [ROLES.CAJERO]: [
        PERMISSIONS.CAN_VIEW_CLIENTS,
        PERMISSIONS.CAN_POS,
        PERMISSIONS.CAN_MANAGE_INVENTORY,
    ],
};

export const usePermissions = () => {
    const { user } = useAuth();

    const hasPermission = (permission) => {
        if (!user || !user.rol) return false;

        if (!permission) return true; // Allow if no permission is required

        // Default to empty array if role doesn't exist
        const userPermissions = ROLE_PERMISSIONS[user.rol] || [];
        return userPermissions.includes(permission);
    };

    const hasRole = (role) => {
        return user?.rol === role;
    };

    return {
        hasPermission,
        hasRole,
        userRole: user?.rol,
        PERMISSIONS
    };
};
