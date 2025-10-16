/**
 * Middleware para verificar se o usuário é um psicólogo autorizado
 *
 * Deve ser usado APÓS o middleware de autenticação (authenticate)
 *
 * Exemplo de uso:
 * router.get('/patients', authenticate, isPsychologist, psychologistController.getPatients);
 */

const isPsychologist = (req, res, next) => {
  // Verificar se o usuário está autenticado
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado',
      message: 'É necessário estar autenticado para acessar este recurso'
    });
  }

  // Verificar se tem flag isPsychologist
  if (!req.user.isPsychologist) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      message: 'Este recurso está disponível apenas para psicólogos autorizados'
    });
  }

  // Usuário é psicólogo - permitir acesso
  next();
};

module.exports = isPsychologist;
