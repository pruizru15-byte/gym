const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ 
                error: 'Access denied. Insufficient permissions',
                required: allowedRoles,
                current: req.user.rol
            });
        }
        
        next();
    };
};

module.exports = roleCheck;
