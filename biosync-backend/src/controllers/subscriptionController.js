const { supabase } = require('../config/supabase');
const asaasService = require('../services/asaas.unified');

// Get all subscription plans
exports.getAllPlans = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    let query = supabase
      .from('subscription_plans')
      .select(`
        *,
        games:plan_games(
          game:games(*)
        )
      `);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: plans, error } = await query.order('price', { ascending: true });

    if (error) throw error;

    // Transform the data to match the expected structure
    const transformedPlans = plans?.map(plan => ({
      ...plan,
      games: plan.games?.map(pg => pg.game).filter(Boolean) || []
    })) || [];

    res.json({
      success: true,
      data: { plans: transformedPlans, count: transformedPlans.length }
    });
  } catch (error) {
    next(error);
  }
};

// Get single plan by ID
exports.getPlanById = async (req, res, next) => {
  try {
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select(`
        *,
        games:plan_games(
          game:games(*)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Transform the data to match the expected structure
    const transformedPlan = {
      ...plan,
      games: plan.games?.map(pg => pg.game).filter(Boolean) || []
    };

    res.json({
      success: true,
      data: { plan: transformedPlan }
    });
  } catch (error) {
    next(error);
  }
};

// Create subscription plan (Admin only)
exports.createPlan = async (req, res, next) => {
  try {
    const { name, description, price, durationDays, gameIds, features } = req.body;

    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .insert({
        name,
        description,
        price,
        duration_days: durationDays,
        features: features || []
      })
      .select()
      .single();

    if (error) throw error;

    // Associate games if provided
    if (gameIds && Array.isArray(gameIds) && gameIds.length > 0) {
      const planGames = gameIds.map(gameId => ({
        plan_id: plan.id,
        game_id: gameId
      }));

      const { error: planGamesError } = await supabase
        .from('plan_games')
        .insert(planGames);

      if (planGamesError) throw planGamesError;
    }

    // Fetch the plan with games
    const { data: planWithGames } = await supabase
      .from('subscription_plans')
      .select(`
        *,
        games:plan_games(
          game:games(*)
        )
      `)
      .eq('id', plan.id)
      .single();

    // Transform the data
    const transformedPlan = {
      ...planWithGames,
      games: planWithGames.games?.map(pg => pg.game).filter(Boolean) || []
    };

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: { plan: transformedPlan }
    });
  } catch (error) {
    next(error);
  }
};

// Update subscription plan (Admin only)
exports.updatePlan = async (req, res, next) => {
  try {
    const { data: plan, error: findError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    const { name, description, price, durationDays, gameIds, features, isActive } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (durationDays) updateData.duration_days = durationDays;
    if (features) updateData.features = features;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await supabase
      .from('subscription_plans')
      .update(updateData)
      .eq('id', req.params.id);

    if (error) throw error;

    // Update associated games if provided
    if (gameIds && Array.isArray(gameIds)) {
      // Remove existing associations
      await supabase
        .from('plan_games')
        .delete()
        .eq('plan_id', plan.id);

      // Create new associations
      if (gameIds.length > 0) {
        const planGames = gameIds.map(gameId => ({
          plan_id: plan.id,
          game_id: gameId
        }));

        const { error: planGamesError } = await supabase
          .from('plan_games')
          .insert(planGames);

        if (planGamesError) throw planGamesError;
      }
    }

    // Fetch updated plan with games
    const { data: updatedPlan } = await supabase
      .from('subscription_plans')
      .select(`
        *,
        games:plan_games(
          game:games(*)
        )
      `)
      .eq('id', plan.id)
      .single();

    // Transform the data
    const transformedPlan = {
      ...updatedPlan,
      games: updatedPlan.games?.map(pg => pg.game).filter(Boolean) || []
    };

    res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: { plan: transformedPlan }
    });
  } catch (error) {
    next(error);
  }
};

// Delete subscription plan (Admin only)
exports.deletePlan = async (req, res, next) => {
  try {
    const { data: plan, error: findError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if any active subscriptions exist
    const { data: activeSubscriptions, error: countError } = await supabase
      .from('user_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', plan.id)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString());

    if (countError) throw countError;

    const count = activeSubscriptions?.length || 0;

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. ${count} active subscription(s) exist.`
      });
    }

    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Assign subscription to user (Admin only)
exports.assignSubscription = async (req, res, next) => {
  try {
    const { userId, planId, durationDays, autoRenew } = req.body;

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify plan exists
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Deactivate existing active subscriptions
    await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Create new subscription
    const startDate = new Date();
    const duration = durationDays || plan.duration_days;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        auto_renew: autoRenew || false
      })
      .select()
      .single();

    if (error) throw error;

    // Fetch subscription with user and plan
    const { data: subscriptionWithPlan } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        user:users(*),
        plan:subscription_plans(
          *,
          games:plan_games(
            game:games(*)
          )
        )
      `)
      .eq('id', subscription.id)
      .single();

    // Transform the plan games data
    if (subscriptionWithPlan?.plan) {
      subscriptionWithPlan.plan.games = subscriptionWithPlan.plan.games?.map(pg => pg.game).filter(Boolean) || [];
    }

    res.status(201).json({
      success: true,
      message: 'Subscription assigned successfully',
      data: { subscription: subscriptionWithPlan }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel user subscription (Admin only)
exports.cancelSubscription = async (req, res, next) => {
  try {
    const { id: subscriptionId } = req.params;

    const { data: subscription, error: findError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (findError || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const { data: updatedSubscription, error } = await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription: updatedSubscription }
    });
  } catch (error) {
    next(error);
  }
};

// Get all user subscriptions (Admin only)
exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const { isActive, page = 1, limit = 50 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        user:users(id, email, full_name)
      `, { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('status', isActive === 'true' ? 'active' : 'cancelled');
    }

    const { data: subscriptions, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        subscriptions: subscriptions || [],
        pagination: {
          total: count || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((count || 0) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's current subscription
exports.getUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(
          *,
          games:plan_games(
            game:games(*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Transform the plan games data if subscription exists
    if (subscription?.plan) {
      subscription.plan.games = subscription.plan.games?.map(pg => pg.game).filter(Boolean) || [];
    }

    res.json({
      success: true,
      data: { subscription: subscription || null }
    });
  } catch (error) {
    next(error);
  }
};

// === Customer subscription endpoints (launcher) ===

exports.createUserSubscription = async (req, res, next) => {
  try {
    const { paymentMethod, creditCard, creditCardHolder } = req.body;
    const userId = req.user.id;

    console.log(`[Subscription] Criando assinatura para usuário ${userId} - Método: ${paymentMethod}`);

    // Validar método de pagamento
    if (!paymentMethod || !['PIX', 'CREDIT_CARD'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pagamento inválido. Use PIX ou CREDIT_CARD'
      });
    }

    // Validar dados de cartão se for CREDIT_CARD
    if (paymentMethod === 'CREDIT_CARD') {
      if (!creditCard || !creditCardHolder) {
        return res.status(400).json({
          success: false,
          message: 'Dados do cartão e titular são obrigatórios para pagamento com cartão'
        });
      }

      // Validar campos obrigatórios do cartão
      const requiredCardFields = ['holderName', 'number', 'expiryMonth', 'expiryYear', 'ccv'];
      const missingCardFields = requiredCardFields.filter(field => !creditCard[field]);

      if (missingCardFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Campos obrigatórios do cartão faltando: ${missingCardFields.join(', ')}`
        });
      }

      // Validar campos do titular
      const requiredHolderFields = ['name', 'email', 'cpfCnpj', 'postalCode', 'addressNumber', 'phone'];
      const missingHolderFields = requiredHolderFields.filter(field => !creditCardHolder[field]);

      if (missingHolderFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Campos obrigatórios do titular faltando: ${missingHolderFields.join(', ')}`
        });
      }
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Você já possui uma assinatura ativa'
      });
    }

    let asaasCustomerId = user.asaas_customer_id;

    if (!asaasCustomerId) {
      console.log('[Subscription] Criando cliente no Asaas...');
      const asaasCustomer = await asaasService.createCustomer({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        cpf: user.cpf,
        phone: user.phone
      });

      asaasCustomerId = asaasCustomer.id;

      await supabase
        .from('users')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', userId);

      console.log(`[Subscription] Cliente Asaas criado: ${asaasCustomerId}`);
    }

    const subscriptionValue = parseFloat(process.env.SUBSCRIPTION_VALUE || 149.90);

    // DIFERENCIAÇÃO CRÍTICA: PIX = Payment único, CARTÃO = Subscription recorrente
    let asaasResponse;
    let isRecurring = false;

    if (paymentMethod === 'PIX') {
      // Para PIX, criar pagamento único mensal (não recorrente)
      console.log('[Subscription] Criando pagamento único PIX...');

      asaasResponse = await asaasService.createPayment(asaasCustomerId, {
        userId,
        paymentMethod: 'PIX',
        value: subscriptionValue,
        description: 'BioSync - Pagamento Mensal'
      });

      isRecurring = false;
    } else {
      // Para CARTÃO, criar assinatura recorrente
      console.log('[Subscription] Criando assinatura recorrente com cartão...');

      asaasResponse = await asaasService.createSubscription(asaasCustomerId, {
        userId,
        paymentMethod: 'CREDIT_CARD',
        value: subscriptionValue,
        description: 'BioSync - Assinatura Mensal',
        creditCard,
        creditCardHolder
      });

      isRecurring = true;
    }

    // Criar registro de subscription no banco
    const { data: newSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: userId,
        asaas_subscription_id: isRecurring ? asaasResponse.id : null,
        asaas_payment_id: !isRecurring ? asaasResponse.id : null,
        status: 'pending',
        plan_value: subscriptionValue,
        billing_cycle: 'MONTHLY',
        payment_method: paymentMethod,
        next_due_date: isRecurring ? asaasResponse.nextDueDate : asaasResponse.dueDate
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    console.log(`[Subscription] Subscription criada no banco: ${newSubscription.id}`);

    // Processar resposta específica por método
    let responseData = {
      subscription: {
        id: newSubscription.id,
        status: newSubscription.status,
        plan_value: newSubscription.plan_value,
        payment_method: paymentMethod,
        next_due_date: newSubscription.next_due_date
      }
    };

    if (paymentMethod === 'PIX') {
      // Buscar QR Code PIX
      try {
        console.log('[Subscription] Buscando QR Code PIX...');
        const pixData = await asaasService.getPixQrCode(asaasResponse.id);

        responseData.payment = {
          pixQrCode: pixData.encodedImage,
          pixCopyPaste: pixData.payload,
          expiresIn: '1 hora'
        };

        // Registrar pagamento na tabela payments
        await supabase
          .from('payments')
          .insert([{
            subscription_id: newSubscription.id,
            asaas_payment_id: asaasResponse.id,
            asaas_invoice_url: asaasResponse.invoiceUrl,
            value: asaasResponse.value,
            status: 'pending',
            payment_method: 'PIX',
            due_date: asaasResponse.dueDate,
            description: 'Pagamento mensal - BioSync'
          }]);

        console.log('[Subscription] QR Code PIX gerado com sucesso');
      } catch (pixError) {
        console.error('[Subscription] Erro ao buscar QR Code PIX:', pixError.message);
        responseData.payment = {
          error: 'Erro ao gerar QR Code. Tente novamente.'
        };
      }
    } else {
      // Para cartão, buscar primeiro pagamento da subscription
      try {
        console.log('[Subscription] Buscando pagamento da assinatura...');
        const payments = await asaasService.listPayments(asaasResponse.id, { limit: 1 });

        if (payments.data && payments.data.length > 0) {
          const firstPayment = payments.data[0];

          await supabase
            .from('payments')
            .insert([{
              subscription_id: newSubscription.id,
              asaas_payment_id: firstPayment.id,
              asaas_invoice_url: firstPayment.invoiceUrl,
              value: firstPayment.value,
              status: asaasService.mapPaymentStatus(firstPayment.status),
              payment_method: 'CREDIT_CARD',
              due_date: firstPayment.dueDate,
              description: 'Primeiro pagamento - BioSync'
            }]);

          responseData.payment = {
            status: firstPayment.status,
            invoiceUrl: firstPayment.invoiceUrl
          };

          console.log(`[Subscription] Pagamento registrado: ${firstPayment.id}`);
        }
      } catch (paymentError) {
        console.error('[Subscription] Erro ao buscar pagamentos:', paymentError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: paymentMethod === 'PIX'
        ? 'Pagamento criado! Escaneie o QR Code para pagar'
        : 'Assinatura criada com sucesso',
      data: responseData
    });
  } catch (error) {
    console.error('[Subscription] Erro ao criar assinatura:', error.message);

    // Retornar erro específico do Asaas se disponível
    return res.status(400).json({
      success: false,
      message: error.message || 'Erro ao criar assinatura',
      details: error.response?.data || null
    });
  }
};

exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !subscription) {
      return res.json({
        success: true,
        data: { hasSubscription: false, subscription: null }
      });
    }

    if (subscription.asaas_subscription_id) {
      try {
        const asaasSubscription = await asaasService.getSubscription(subscription.asaas_subscription_id);
        const newStatus = asaasService.mapSubscriptionStatus(asaasSubscription.status);

        if (newStatus !== subscription.status) {
          await supabase
            .from('subscriptions')
            .update({ status: newStatus })
            .eq('id', subscription.id);

          subscription.status = newStatus;
        }
      } catch (asaasError) {
        console.error('Erro ao sincronizar com Asaas:', asaasError.message);
      }
    }

    return res.json({
      success: true,
      data: {
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan_value: subscription.plan_value,
          billing_cycle: subscription.billing_cycle,
          next_due_date: subscription.next_due_date,
          payment_method: subscription.payment_method,
          started_at: subscription.started_at,
          isActive: subscription.status === 'active'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelUserSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma assinatura ativa encontrada'
      });
    }

    if (subscription.asaas_subscription_id) {
      try {
        await asaasService.cancelSubscription(subscription.asaas_subscription_id);
      } catch (asaasError) {
        console.error('Erro ao cancelar no Asaas:', asaasError.message);
      }
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    return res.json({
      success: true,
      message: 'Assinatura cancelada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

exports.checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      return res.json({
        success: true,
        data: {
          isActive: false,
          needsRenewal: true,
          daysUntilExpiration: 0
        }
      });
    }

    const now = new Date();
    const nextDueDate = new Date(subscription.next_due_date);
    const daysUntilExpiration = Math.ceil((nextDueDate - now) / (1000 * 60 * 60 * 24));

    return res.json({
      success: true,
      data: {
        isActive: true,
        needsRenewal: daysUntilExpiration <= 3,
        daysUntilExpiration,
        nextDueDate: subscription.next_due_date,
        paymentMethod: subscription.payment_method,
        planValue: subscription.plan_value
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.listSubscriptionPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return res.json({
        success: true,
        data: { payments: [] }
      });
    }

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('subscription_id', subscription.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: { payments: payments || [] }
    });
  } catch (error) {
    next(error);
  }
};
