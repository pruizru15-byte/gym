const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // SQLite errors
    if (err.code === 'SQLITE_CONSTRAINT') {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ 
                error: 'Duplicate entry. This value already exists in the database.' 
            });
        }
        return res.status(400).json({ error: 'Database constraint violation' });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }
    
    // Multer errors (file upload)
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    
    // Default error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
