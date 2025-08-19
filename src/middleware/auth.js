// Проверка авторизации
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Необхідна авторизація' });
  }
  next();
}

// Проверка прав администратора
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Недостатньо прав доступу' });
  }
  next();
}

// Проверка прав агента
function requireAgent(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'agent') {
    return res.status(403).json({ error: 'Доступ тільки для агентів' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireAgent
};
