import { Navigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'

const PermissionGuard = ({ children, permission }) => {
    const { hasPermission } = usePermissions()

    if (!hasPermission(permission)) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

export default PermissionGuard
