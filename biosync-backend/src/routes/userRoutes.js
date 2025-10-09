const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { validateRegister, validateUpdateUser, validateUUID } = require('../middleware/validator');

// All routes require admin privileges
router.use(authenticate, authorizeAdmin);

router.get('/', userController.getAllUsers);
router.get('/:id', validateUUID, userController.getUserById);
router.post('/', validateRegister, userController.createUser);
router.put('/:id', validateUUID, validateUpdateUser, userController.updateUser);
router.delete('/:id', validateUUID, userController.deleteUser);

// Game access management
router.post('/game-access', userController.grantGameAccess);
router.delete('/:userId/game-access/:gameId', userController.revokeGameAccess);

// User history
router.get('/:id/history', validateUUID, userController.getUserHistory);

module.exports = router;
