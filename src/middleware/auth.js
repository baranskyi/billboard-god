// Authentication check
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Admin rights check
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}

// Agent rights check
function requireAgent(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'agent') {
    return res.status(403).json({ error: 'Agent access only' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireAgent
};
