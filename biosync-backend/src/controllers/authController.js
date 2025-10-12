const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { supabase } = require('../config/supabase');
const jwtConfig = require('../config/jwt');
const asaasService = require('../services/asaas');

const generateAccessToken = (payload) =>
  jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn });

const sanitizeUser = (user) => {
  if (!user) return null;

  const {
    password,
    created_at,
    updated_at,
    full_name,
    is_admin,
    is_active,
    asaas_customer_id,
    ...rest
  } = user;

  return {
    ...rest,
    id: user.id,
    email: user.email,
    username: user.username || null,
    full_name,
    fullName: full_name,
    is_admin,
    isAdmin: is_admin,
    is_active,
    isActive: is_active,
    asaas_customer_id,
    asaasCustomerId: asaas_customer_id,
    last_login: user.last_login,
    created_at,
    updated_at
  };
};

const fetchActiveSubscription = async (userId) => {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!subscription && error?.code === 'PGRST116') {
    return null;
  }

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return subscription;
};

const buildAuthResponse = async (user) => {
  const subscription = await fetchActiveSubscription(user.id);

  const payload = {
    userId: user.id,
    email: user.email,
    isAdmin: user.is_admin,
    hasActiveSubscription: Boolean(subscription),
    subscriptionId: subscription?.id || null
  };

  const token = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: sanitizeUser(user),
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          plan_value: subscription.plan_value,
          planValue: subscription.plan_value,
          next_due_date: subscription.next_due_date,
          nextDueDate: subscription.next_due_date,
          payment_method: subscription.payment_method,
          paymentMethod: subscription.payment_method
        }
      : null,
    token,
    refreshToken,
    hasActiveSubscription: Boolean(subscription)
  };
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, username } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, senha e nome completo sao obrigatorios'
      });
    }

    const normalizedEmail = email.toLowerCase();

    const orFilters = ['email.eq.' + normalizedEmail];
    if (username) {
      orFilters.push('username.eq.' + username);
    }

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .or(orFilters.join(','))
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este email ou usuario ja esta cadastrado'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let generatedUsername = username;
    if (!generatedUsername) {
      const localPart = normalizedEmail.split('@')[0];
      generatedUsername = localPart.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 30);
      if (!generatedUsername) {
        generatedUsername = 'user_' + Date.now();
      }

      const { data: usernameConflict } = await supabase
        .from('users')
        .select('id')
        .eq('username', generatedUsername)
        .maybeSingle();

      if (usernameConflict) {
        generatedUsername = generatedUsername + '_' + Date.now().toString().slice(-4);
      }
    }

    const insertPayload = {
      email: normalizedEmail,
      full_name: fullName,
      username: generatedUsername,
      is_active: true,
      is_admin: false,
      password: passwordHash,
      password_hash: passwordHash
    };

    let newUser;
    try {
      const insertResult = await supabase
        .from('users')
        .insert([insertPayload])
        .select()
        .single();

      if (insertResult.error) {
        throw insertResult.error;
      }

      newUser = insertResult.data;
    } catch (insertError) {
      if (insertError?.code === 'PGRST204' && insertError?.message?.includes('username')) {
        delete insertPayload.username;

        const retryResult = await supabase
          .from('users')
          .insert([insertPayload])
          .select()
          .single();

        if (retryResult.error) {
          throw retryResult.error;
        }

        newUser = retryResult.data;
      } else {
        throw insertError;
      }
    }

    try {
      const asaasCustomer = await asaasService.createCustomer({
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name
      });

      await supabase
        .from('users')
        .update({ asaas_customer_id: asaasCustomer.id })
        .eq('id', newUser.id);

      newUser.asaas_customer_id = asaasCustomer.id;
    } catch (asaasError) {
      console.warn('[auth] Falha ao criar cliente no Asaas:', asaasError.message || asaasError);
    }

    const authData = await buildAuthResponse(newUser);

    return res.status(201).json({
      success: true,
      message: 'Usuario criado com sucesso',
      data: authData
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return res.status(400).json({
        success: false,
        message: 'Email ou usuário e senha são obrigatórios'
      });
    }

    const normalizedEmail = email ? email.toLowerCase() : null;

    const orFilters = [];
    if (normalizedEmail) {
      orFilters.push('email.eq.' + normalizedEmail);
    }
    if (username) {
      orFilters.push('username.eq.' + username);
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(orFilters.join(','))
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Usuário desativado. Entre em contato com o suporte.'
      });
    }

    const storedHash = user.password;

    // DEBUG: Log de verificação de senha
    console.log('[DEBUG LOGIN]', {
      email: user.email,
      passwordReceived: password,
      passwordLength: password.length,
      hashLength: storedHash ? storedHash.length : 0,
      hashPreview: storedHash ? storedHash.substring(0, 20) : 'null'
    });

    const passwordMatch = storedHash
      ? await bcrypt.compare(password, storedHash)
      : false;

    console.log('[DEBUG LOGIN] Password match result:', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const authData = await buildAuthResponse(user);

    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: authData
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token é obrigatório'
      });
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido'
      });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin
    };

    return res.json({
      success: true,
      data: {
        token: generateAccessToken(payload),
        refreshToken: generateRefreshToken(user.id)
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token inválido ou expirado'
    });
  }
};

exports.validateToken = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, full_name, is_admin, is_active, asaas_customer_id')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    return res.json({
      success: true,
      data: { user: sanitizeUser(user) }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const subscription = await fetchActiveSubscription(user.id);

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          plan_value: subscription.plan_value,
          planValue: subscription.plan_value,
          next_due_date: subscription.next_due_date,
          nextDueDate: subscription.next_due_date,
          payment_method: subscription.payment_method,
          paymentMethod: subscription.payment_method
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (_req, res) => {
  return res.json({
    success: true,
    message: 'Logout efetuado. Remova o token no cliente.'
  });
};

exports.heartbeat = async (req, res, next) => {
  try {
    const { deviceId, deviceName, osInfo, launcherVersion } = req.body;
    const userId = req.user.id;

    const subscription = await fetchActiveSubscription(userId);
    const subscriptionStatus = subscription?.status || 'none';
    const hasActiveSubscription = subscriptionStatus === 'active';

    const sessionData = {
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName || 'Unknown Device',
      os_info: osInfo || null,
      launcher_version: launcherVersion || null,
      token_hash: req.headers.authorization?.split(' ')[1] || null,
      last_heartbeat: new Date().toISOString(),
      subscription_status_cache: subscriptionStatus,
      ip_address: req.ip
    };

    const { data: existingSession } = await supabase
      .from('launcher_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existingSession) {
      await supabase
        .from('launcher_sessions')
        .update(sessionData)
        .eq('id', existingSession.id);
    } else {
      await supabase
        .from('launcher_sessions')
        .insert([sessionData]);
    }

    return res.json({
      success: true,
      data: {
        hasActiveSubscription,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          next_due_date: subscription.next_due_date,
          nextDueDate: subscription.next_due_date,
          plan_value: subscription.plan_value,
          planValue: subscription.plan_value
        } : null,
        serverTime: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};
