// admin/server.js - BACKEND SIMPLIFICADO SEM FILTROS
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ====================
// CONFIGURAÇÃO INICIAL
// ====================

dotenv.config();

console.log('🔧 Iniciando RG Pet Backend Simplificado...');

const requiredEnvVars = {
  'SUPABASE_URL': process.env.SUPABASE_URL,
  'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌',
  'SUPABASE_BUCKET': process.env.SUPABASE_BUCKET || 'backrg',
  'NODE_ENV': process.env.NODE_ENV || 'development'
};

console.table(requiredEnvVars);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ ERRO: Variáveis do Supabase faltando!');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// ====================
// MIDDLEWARES
// ====================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin', express.static(path.join(__dirname, '.')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📍 ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ====================
// SUPABASE CLIENT
// ====================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ====================
// FUNÇÕES AUXILIARES
// ====================

/**
 * Busca foto no bucket - VERSÃO SIMPLIFICADA
 */
async function getPetPhotoFromBucket(orderId, orderNumber) {
  try {
    const bucketName = process.env.SUPABASE_BUCKET || 'backrg';
    
    console.log(`🔍 Buscando foto para: ${orderNumber}`);

    // Lista todos os arquivos
    const { data: allFiles, error } = await supabase.storage
      .from(bucketName)
      .list('pet-photos', { 
        limit: 500
      });

    if (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      return null;
    }

    if (!allFiles || allFiles.length === 0) {
      console.log('📭 Pasta pet-photos está vazia');
      return null;
    }

    // Busca por orderId (UUID) - primeira parte do nome
    if (orderId) {
      const foundFile = allFiles.find(file => {
        const firstPart = file.name.split('_')[0];
        return firstPart === orderId;
      });
      
      if (foundFile) {
        const photoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/pet-photos/${foundFile.name}`;
        console.log(`✅ Foto encontrada: ${foundFile.name}`);
        return photoUrl;
      }
    }

    console.log('❌ Nenhuma foto encontrada');
    return null;

  } catch (error) {
    console.error('❌ Erro ao buscar foto:', error);
    return null;
  }
}

/**
 * Busca foto do pet - VERSÃO SIMPLIFICADA
 */
async function findPetPhoto(order) {
  console.log(`🔍 Buscando foto para: ${order.order_number}`);
  
  // Estratégia 1: pet_photo_url direto do banco
  if (order.pet_photo_url) {
    console.log(`✅ Foto encontrada em pet_photo_url`);
    return order.pet_photo_url;
  }

  // Estratégia 2: Buscar no bucket
  console.log(`📦 Buscando no bucket...`);
  const bucketPhoto = await getPetPhotoFromBucket(order.id, order.order_number);
  
  if (bucketPhoto) {
    console.log(`✅ Foto encontrada no bucket`);
    
    // Salvar a URL no banco para futuras consultas
    await savePhotoUrlToDatabase(order.id, bucketPhoto);
    
    return bucketPhoto;
  }

  console.log('❌ Nenhuma foto encontrada');
  return null;
}

/**
 * Salva a URL da foto no banco para otimizar consultas futuras
 */
async function savePhotoUrlToDatabase(orderId, photoUrl) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        pet_photo_url: photoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error('❌ Erro ao salvar URL no banco:', error);
    } else {
      console.log('💾 URL salva no banco');
    }
  } catch (error) {
    console.error('❌ Erro ao salvar URL:', error);
  }
}

// ====================
// ROTAS DA API PÚBLICA
// ====================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'RG Pet Backend',
    version: '2.3.0',
    environment: process.env.NODE_ENV,
    bucket: process.env.SUPABASE_BUCKET || 'backrg'
  });
});

// Criar novo pedido
app.post('/api/orders', async (req, res) => {
  try {
    const {
      pet_name, pet_gender, pet_breed, pet_color, pet_birth_date,
      owner_name, owner_contact, address_state, address_city,
      address_neighborhood, address_street, address_number,
      preferences_team, selected_backgrounds, session_id, user_agent
    } = req.body;

    // Validação básica
    if (!pet_name || !pet_gender || !owner_name || !owner_contact) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'Nome do pet, sexo, nome do tutor e contato são obrigatórios'
      });
    }

    const orderNumber = `RG-PET-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const orderData = {
      order_number: orderNumber,
      pet_name: pet_name.trim(),
      pet_gender,
      pet_breed: (pet_breed || 'Não informado').trim(),
      pet_color: (pet_color || 'Não informado').trim(),
      pet_birth_date: pet_birth_date || '',
      owner_name: owner_name.trim(),
      owner_contact: owner_contact.trim(),
      address_state: (address_state || 'Não informado').trim(),
      address_city: (address_city || 'Não informado').trim(),
      address_neighborhood: (address_neighborhood || 'Não informado').trim(),
      address_street: (address_street || 'Não informado').trim(),
      address_number: (address_number || 'Não informado').trim(),
      preferences_team: preferences_team || 'nenhum_time',
      selected_backgrounds: selected_backgrounds || '{}',
      session_id: session_id || 'unknown',
      user_agent: user_agent || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📦 Salvando pedido:', orderNumber);

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Pedido salvo com sucesso:', orderNumber);

    res.status(201).json({
      success: true,
      orderId: data.id,
      orderNumber: data.order_number,
      message: 'Pedido criado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({
      error: 'Erro interno ao salvar pedido',
      message: error.message
    });
  }
});

// Upload de fotos
app.post('/api/upload/signed-url', async (req, res) => {
  try {
    const { fileName, fileType, orderId } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'Nome e tipo do arquivo são obrigatórios'
      });
    }

    const bucketName = process.env.SUPABASE_BUCKET || 'backrg';

    const sanitizedFileName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .substring(0, 100);

    const fileIdentifier = orderId || req.body.session_id || 'unknown';
    const filePath = `pet-photos/${fileIdentifier}_${Date.now()}_${sanitizedFileName}`;

    console.log('📤 Gerando URL assinada para:', filePath);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;

    res.json({
      success: true,
      signedUrl: data.signedUrl,
      filePath: filePath,
      publicUrl: publicUrl
    });

  } catch (error) {
    console.error('❌ Erro ao gerar URL assinada:', error);
    res.status(500).json({
      error: 'Erro ao preparar upload',
      message: error.message
    });
  }
});

// ====================
// ROTAS DO PAINEL ADMIN
// ====================

// Painel Admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Estatísticas
app.get('/admin/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      pending: data?.filter(o => o.status === 'pending').length || 0,
      processing: data?.filter(o => o.status === 'processing').length || 0,
      completed: data?.filter(o => o.status === 'completed').length || 0,
      cancelled: data?.filter(o => o.status === 'cancelled').length || 0,
      updated_at: new Date().toISOString()
    };

    res.json(stats);

  } catch (error) {
    console.error('❌ Erro ao carregar estatísticas:', error);
    res.status(500).json({
      error: 'Erro ao carregar estatísticas',
      message: error.message
    });
  }
});

// Listar pedidos - VERSÃO SIMPLIFICADA SEM FILTROS
app.get('/admin/api/orders', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    
    console.log('📦 Carregando todos os pedidos...');
    
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;

    // Busca TODOS os pedidos, ordenados pelos mais recentes
    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Processar fotos do bucket
    console.log(`🔄 Processando fotos para ${data?.length || 0} pedidos...`);
    const ordersWithPhotos = await Promise.all(
      (data || []).map(async (order) => {
        const pet_photo_url = await findPetPhoto(order);
        
        return {
          ...order,
          pet_photo_url: pet_photo_url
        };
      })
    );

    console.log(`✅ ${ordersWithPhotos.length} pedidos carregados`);
    console.log(`📸 Pedidos com foto: ${ordersWithPhotos.filter(o => o.pet_photo_url).length}`);

    res.json({
      success: true,
      orders: ordersWithPhotos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pedidos:', error);
    res.status(500).json({
      error: 'Erro ao carregar pedidos',
      message: error.message
    });
  }
});

// Atualizar status do pedido
app.patch('/admin/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'Status é obrigatório'
      });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
        message: `Status deve ser um dos: ${validStatuses.join(', ')}`
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
        message: `Pedido com ID ${id} não existe`
      });
    }

    console.log('✅ Status atualizado:', id, '->', status);

    res.json({ 
      success: true, 
      order: data,
      message: 'Status atualizado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar pedido:', error);
    res.status(500).json({
      error: 'Erro ao atualizar pedido',
      message: error.message
    });
  }
});

// Excluir pedido - VERSÃO SIMPLIFICADA E ROBUSTA
app.delete('/admin/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ EXCLUSÃO SIMPLIFICADA para: ${id}`);

    // Buscar pedido primeiro para verificar existência
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', id)
      .single();

    if (fetchError || !existingOrder) {
      console.error('❌ Pedido não encontrado:', fetchError);
      return res.status(404).json({
        error: 'Pedido não encontrado',
        message: `Pedido com ID ${id} não existe`
      });
    }

    console.log(`📋 Pedido localizado: ${existingOrder.order_number}`);

    // Exclusão SIMPLES - sem select, sem fotos
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Erro na exclusão:', deleteError);
      throw deleteError;
    }

    console.log(`✅ EXCLUSÃO BEM-SUCEDIDA: ${existingOrder.order_number}`);

    res.json({
      success: true,
      message: `Pedido ${existingOrder.order_number} excluído com sucesso!`,
      deletedOrder: {
        id: id,
        order_number: existingOrder.order_number
      }
    });

  } catch (error) {
    console.error('❌ Erro geral na exclusão:', error);
    res.status(500).json({
      error: 'Erro ao excluir pedido',
      message: error.message,
      code: error.code,
      hint: 'Verifique RLS policies no Supabase'
    });
  }
});

// Teste de permissões
app.get('/admin/api/test-permissions', async (req, res) => {
  try {
    console.log('🔐 Testando permissões do Supabase...');
    
    // Testar SELECT
    const { data: selectData, error: selectError } = await supabase
      .from('orders')
      .select('count')
      .limit(1);
    
    // Testar DELETE (com um pedido que não existe, só para testar permissões)
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', 'test-nonexistent-id');
    
    res.json({
      select: selectError ? `❌ ${selectError.message}` : '✅ OK',
      delete: deleteError ? `❌ ${deleteError.message}` : '✅ OK',
      usingServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0,
      supabaseUrl: process.env.SUPABASE_URL
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================
// ROTAS DE DEBUG (OPCIONAIS)
// ====================

// Rota para verificar dados dos pedidos
app.get('/admin/api/check-photos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, pet_photo_url, photo_url, pet_name')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const stats = {
      total_orders: data?.length || 0,
      with_pet_photo_url: data?.filter(o => o.pet_photo_url).length || 0,
      with_photo_url: data?.filter(o => o.photo_url).length || 0,
      orders: data?.map(order => ({
        id: order.id,
        order_number: order.order_number,
        pet_name: order.pet_name,
        pet_photo_url: order.pet_photo_url ? '✅ SIM' : '❌ NÃO',
        photo_url: order.photo_url ? '✅ SIM' : '❌ NÃO'
      }))
    };

    res.json(stats);

  } catch (error) {
    console.error('❌ Erro ao verificar fotos:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================
// ROTAS DE FALLBACK
// ====================

// Rota padrão - servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 Handler
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      error: 'Endpoint não encontrado',
      message: `Rota ${req.originalUrl} não existe`
    });
  }
  
  // Para rotas não-API, servir o frontend (SPA behavior)
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler global
app.use((error, req, res, next) => {
  console.error('❌ Erro global não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
  });
});

// ====================
// INICIALIZAÇÃO
// ====================

async function startServer() {
  try {
    // Testar conexão com banco
    console.log('🔗 Testando conexão com Supabase...');
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Aviso na conexão inicial:', error.message);
    } else {
      console.log('✅ Conexão com Supabase estabelecida!');
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n🎉 =================================');
      console.log('🚀 RG Pet BACKEND SIMPLIFICADO!');
      console.log('📍 Porta:', PORT);
      console.log('📍 Ambiente:', process.env.NODE_ENV);
      console.log('📍 Frontend: http://localhost:' + PORT);
      console.log('📊 Painel Admin: http://localhost:' + PORT + '/admin');
      console.log('❤️  Health: http://localhost:' + PORT + '/api/health');
      console.log('🔐 Teste Permissões: http://localhost:' + PORT + '/admin/api/test-permissions');
      console.log('🎉 =================================\n');
    });

  } catch (error) {
    console.error('❌ Falha crítica ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar aplicação
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor...');
  process.exit(0);
});