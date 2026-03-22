const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const QR_SECRET = "pythathon_secret_2024_secure_shield";

function getQRSignature(id) {
  return crypto.createHmac('sha256', QR_SECRET).update(id).digest('hex').substring(0, 10);
}

async function main() {
  // Limpiar un poco antes de sembrar datos masivos
  // await prisma.order.deleteMany({});
  // await prisma.missionProgress.deleteMany({});
  
  const adminHash = await bcrypt.hash('admin-pass', 10);
  const merchantHash = await bcrypt.hash('merchant-pass', 10);
  const playerHash = await bcrypt.hash('pass123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pythathon.com' },
    update: { role: 'ADMIN', javitosBalance: 1500, passwordHash: adminHash },
    create: { email: 'admin@pythathon.com', displayName: 'Pythathon Admin', passwordHash: adminHash, role: 'ADMIN', javitosBalance: 1500 },
  });

  const merchantUser1 = await prisma.user.upsert({
    where: { email: 'merchant@pythathon.com' },
    update: { role: 'MERCHANT', passwordHash: merchantHash },
    create: { email: 'merchant@pythathon.com', displayName: 'Coffee Store Owner', passwordHash: merchantHash, role: 'MERCHANT' },
  });

  const merchantUser2 = await prisma.user.upsert({
    where: { email: 'techstore@pythathon.com' },
    update: { role: 'MERCHANT', passwordHash: merchantHash },
    create: { email: 'techstore@pythathon.com', displayName: 'Tech Shop Manager', passwordHash: merchantHash, role: 'MERCHANT' },
  });

  const player1 = await prisma.user.upsert({
    where: { email: 'player1@pythathon.com' },
    update: { role: 'PLAYER', javitosBalance: 320, passwordHash: playerHash },
    create: { email: 'player1@pythathon.com', displayName: 'Crypto Explorer', passwordHash: playerHash, role: 'PLAYER', javitosBalance: 320 },
  });

  const player2 = await prisma.user.upsert({
    where: { email: 'player2@pythathon.com' },
    update: { role: 'PLAYER', javitosBalance: 85, passwordHash: playerHash },
    create: { email: 'player2@pythathon.com', displayName: 'Blockchain Ninja', passwordHash: playerHash, role: 'PLAYER', javitosBalance: 85 },
  });

  const merchant = await prisma.merchant.upsert({
    where: { userId: merchantUser1.id },
    update: { walletAddress: 'addr_test1qq8l65042p6ucgsan6zzjsl0gfhzmpcw2cmx5ygkgdm9hg3s3m563u3devt89fenf6q3lqtnclpcamh3dhdklcnqr78s4uq88g' },
    create: { userId: merchantUser1.id, businessName: 'Pythathon Coffee', walletAddress: 'addr_test1qq8l65042p6ucgsan6zzjsl0gfhzmpcw2cmx5ygkgdm9hg3s3m563u3devt89fenf6q3lqtnclpcamh3dhdklcnqr78s4uq88g' },
  });

  const merchant2 = await prisma.merchant.upsert({
    where: { userId: merchantUser2.id },
    update: { walletAddress: 'addr_test1qq8l65042p6ucgsan6zzjsl0gfhzmpcw2cmx5ygkgdm9hg3s3m563u3devt89fenf6q3lqtnclpcamh3dhdklcnqr78s4uq88g' },
    create: { userId: merchantUser2.id, businessName: 'Web3 Tech Gear', walletAddress: 'addr_test1qq8l65042p6ucgsan6zzjsl0gfhzmpcw2cmx5ygkgdm9hg3s3m563u3devt89fenf6q3lqtnclpcamh3dhdklcnqr78s4uq88g' },
  });

  // Locaciones
  const loc1 = await prisma.location.upsert({ where: { id: 'loc-1' }, update: {}, create: { id: 'loc-1', merchantId: merchant.id, name: 'Escenario Principal', latitude: -34.6037, longitude: -58.3816, radiusMeters: 200, isActive: true } });
  const loc2 = await prisma.location.upsert({ where: { id: 'loc-2' }, update: {}, create: { id: 'loc-2', merchantId: merchant2.id, name: 'Zona de Hackathon', latitude: -34.5828, longitude: -58.4234, radiusMeters: 150, isActive: true } });

  // Misiones
  const missionsData = [
    { id: '1', titleEs: 'Ruta Códice Cripto', titleEn: 'Crypto Codex Route', descriptionEs: 'Encuentra el stand de Pyth y escanea el código inicial.', descriptionEn: 'Find the Pyth booth and scan the starting code.', type: 'MAIN', javitosReward: 200, status: 'ACTIVE', createdBy: admin.id },
    { id: '2', titleEs: 'El Acertijo del Oráculo', titleEn: 'Oracle Riddle', descriptionEs: 'Busca a los mentores en la Zona de Hackathon.', descriptionEn: 'Find the mentors in the Hackathon Zone.', type: 'SIDE', javitosReward: 350, status: 'ACTIVE', createdBy: admin.id },
    { id: '3', titleEs: 'Networking Maestro', titleEn: 'Master Networking', descriptionEs: 'Conversa con 3 equipos diferentes y encuentra el QR grupal.', descriptionEn: 'Talk to 3 different teams and find the group QR.', type: 'GROUP', javitosReward: 500, status: 'ACTIVE', createdBy: admin.id },
    { id: '4', titleEs: 'Coffee Break Cripto', titleEn: 'Crypto Coffee Break', descriptionEs: 'Visita el Pythathon Coffee para recuperar energías.', descriptionEn: 'Visit Pythathon Coffee to recharge.', type: 'DAILY', javitosReward: 50, status: 'ACTIVE', createdBy: admin.id },
  ];

  for (const m of missionsData) {
    await prisma.mission.upsert({ where: { id: m.id }, update: m, create: m });
    const signature = getQRSignature(m.id);
    console.log(`Misión ${m.id} QR válido: pythathon-mission-${m.id}-${signature}`);
  }

  // Progreso de usuarios
  const progresses = [
     { userId: player1.id, missionId: '1', status: 'COMPLETED', completedAt: new Date(Date.now() - 86400000) },
     { userId: player1.id, missionId: '2', status: 'IN_PROGRESS' },
     { userId: player2.id, missionId: '1', status: 'ACCEPTED' },
  ];
  
  for (const prog of progresses) {
    try {
      // Ignorar errores si ya existe (clave única: userId_missionId)
      await prisma.missionProgress.create({ data: prog });
    } catch(e) {}
  }

  // Productos
  const productsData = [
    { id: 'p1', merchantId: merchant.id, nameEs: 'Café Espresso Premium', nameEn: 'Premium Espresso', descriptionEs: 'Carga de energía.', descriptionEn: 'Energy boost.', priceUsd: 2.50, javitosRequired: 50, discountPercentage: 20, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500&q=80', isActive: true },
    { id: 'p2', merchantId: merchant.id, nameEs: 'Sandwich de Miga', nameEn: 'Crustless Sandwich', descriptionEs: 'El clásico argentino.', descriptionEn: 'Argentinian classic.', priceUsd: 3.00, javitosRequired: 100, discountPercentage: 50, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1596662951362-b13c77843d1a?w=500&q=80', isActive: true },
    { id: 'p3', merchantId: merchant2.id, nameEs: 'Hoodie Pyth Network', nameEn: 'Pyth Network Hoodie', descriptionEs: 'Edición limitada del hackathon.', descriptionEn: 'Limited hackathon edition.', priceUsd: 35.00, javitosRequired: 1500, discountPercentage: 30, stock: 20, imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80', isActive: true },
    { id: 'p4', merchantId: merchant2.id, nameEs: 'Sticker Pack Web3', nameEn: 'Web3 Sticker Pack', descriptionEs: 'Para tu laptop.', descriptionEn: 'For your laptop.', priceUsd: 5.00, javitosRequired: 100, discountPercentage: 100, stock: 200, imageUrl: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=500&q=80', isActive: true },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
  }

  // Órdenes
  const orders = [
    { id: 'ord-1', userId: player1.id, productId: 'p1', priceAdaAtPurchase: 5.42, priceUsdAtPurchase: 2.50, javitosUsed: 50, discountApplied: 20, txHash: '0xabc1234567890testtxhashcardanoscan', escrowStatus: 'LOCKED', createdAt: new Date(Date.now() - 86400000) },
    { id: 'ord-2', userId: player1.id, productId: 'p3', priceAdaAtPurchase: 75.80, priceUsdAtPurchase: 35.00, javitosUsed: 1500, discountApplied: 30, txHash: '0xdef0987654321testtxhashcardanoscan', escrowStatus: 'LOCKED', createdAt: new Date(Date.now() - 172800000) },
    { id: 'ord-3', userId: player2.id, productId: 'p1', priceAdaAtPurchase: 5.40, priceUsdAtPurchase: 2.50, javitosUsed: 0, discountApplied: 0, txHash: null, escrowStatus: 'PENDING', createdAt: new Date() },
    { id: 'ord-4', userId: admin.id, productId: 'p4', priceAdaAtPurchase: 10.84, priceUsdAtPurchase: 5.00, javitosUsed: 100, discountApplied: 100, txHash: '0x123cccbbbbaaatesttxhashcardanoscan', escrowStatus: 'LOCKED', createdAt: new Date(Date.now() - 3600000) },
  ];

  for (const o of orders) {
    await prisma.order.upsert({ where: { id: o.id }, update: o, create: o });
  }

  console.log('Seed COMPLETADO! 🎉 Datos cargados masivamente para pruebas.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

