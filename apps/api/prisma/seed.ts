import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding banco de dados de exemplo...");

  await prisma.stallNotification.deleteMany();
  await prisma.activityEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.roadmapPhase.deleteMany();
  await prisma.roadmapItem.deleteMany();
  await prisma.dashboardTeamPreference.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.stallRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  const passwordHash = await hash("senha123");

  const admin = await prisma.user.create({
    data: {
      name: "Ana Admin",
      email: "admin@example.com",
      passwordHash,
      globalRole: "ADMIN",
      notificationPreference: { create: {} },
    },
  });

  const marina = await prisma.user.create({
    data: {
      name: "Marina Gestora",
      email: "marina@example.com",
      passwordHash,
      notificationPreference: { create: {} },
    },
  });

  const carlos = await prisma.user.create({
    data: {
      name: "Carlos Gestor",
      email: "carlos@example.com",
      passwordHash,
      notificationPreference: { create: {} },
    },
  });

  const julia = await prisma.user.create({
    data: {
      name: "Julia Colaboradora",
      email: "julia@example.com",
      passwordHash,
      notificationPreference: { create: {} },
    },
  });

  const pedro = await prisma.user.create({
    data: {
      name: "Pedro Colaborador",
      email: "pedro@example.com",
      passwordHash,
      notificationPreference: { create: {} },
    },
  });

  const produto = await prisma.team.create({ data: { name: "Produto", description: "Time de produto e tecnologia" } });
  const marketing = await prisma.team.create({ data: { name: "Marketing", description: "Time de marketing e growth" } });

  await prisma.teamMember.createMany({
    data: [
      { teamId: produto.id, userId: marina.id, teamRole: "MANAGER" },
      { teamId: produto.id, userId: julia.id, teamRole: "COLLABORATOR" },
      { teamId: produto.id, userId: pedro.id, teamRole: "COLLABORATOR" },
      { teamId: marketing.id, userId: carlos.id, teamRole: "MANAGER" },
      { teamId: marketing.id, userId: julia.id, teamRole: "COLLABORATOR" },
    ],
  });

  await prisma.stallRule.create({
    data: { scope: "GLOBAL", tolerancePercent: 0.15, minToleranceDays: 7, maxToleranceDays: 45, reminderIntervalDays: 7 },
  });

  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);
  const daysFromNow = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000);

  // Item de longo prazo com fases (ex.: "Fase 1 - Descoberta, Fase 2 - Construção, Fase 3 - Lançamento")
  await prisma.roadmapItem.create({
    data: {
      teamId: produto.id,
      title: "Expansão para novos mercados",
      description: "Avaliar e lançar o produto em 3 novos países",
      horizon: "LONG",
      targetDate: daysFromNow(365),
      targetYear: new Date().getFullYear() + 1,
      ownerId: marina.id,
      createdById: marina.id,
      priority: "HIGH",
      status: "EM_ANALISE",
      hasPhases: true,
      lastActivityAt: daysAgo(5),
      phases: {
        create: [
          {
            name: "Fase 1 — Descoberta",
            order: 0,
            estimatedStartDate: daysFromNow(30),
            estimatedEndDate: daysFromNow(90),
            status: "PLANEJADA",
          },
          {
            name: "Fase 2 — Construção",
            order: 1,
            estimatedStartDate: daysFromNow(91),
            estimatedEndDate: daysFromNow(240),
            status: "PLANEJADA",
          },
          {
            name: "Fase 3 — Lançamento",
            order: 2,
            estimatedStartDate: daysFromNow(241),
            estimatedEndDate: daysFromNow(365),
            status: "PLANEJADA",
          },
        ],
      },
    },
  });

  // Item de médio prazo propositalmente parado, para testar a detecção de estagnação
  await prisma.roadmapItem.create({
    data: {
      teamId: produto.id,
      title: "Revisão do onboarding de novos usuários",
      description: "Redesenhar o fluxo de onboarding para reduzir churn na primeira semana",
      horizon: "MEDIUM",
      targetDate: daysFromNow(150),
      ownerId: julia.id,
      createdById: marina.id,
      priority: "MEDIUM",
      status: "PLANEJADO",
      lastActivityAt: daysAgo(40),
      createdAt: daysAgo(60),
    },
  });

  // Item de curto prazo, saudável
  await prisma.roadmapItem.create({
    data: {
      teamId: marketing.id,
      title: "Campanha de lançamento Q4",
      horizon: "SHORT",
      targetQuarter: "Q4 2026",
      targetYear: 2026,
      ownerId: carlos.id,
      createdById: carlos.id,
      priority: "HIGH",
      status: "INICIADO",
      lastActivityAt: daysAgo(1),
    },
  });

  // Projeto ativo e saudável, com tarefas e subtarefas
  const projeto = await prisma.project.create({
    data: {
      teamId: produto.id,
      title: "Redesign do checkout",
      description: "Reduzir abandono de carrinho no checkout",
      ownerId: marina.id,
      priority: "HIGH",
      status: "ACTIVE",
      targetDate: daysFromNow(60),
      startedAt: daysAgo(20),
      lastActivityAt: daysAgo(1),
    },
  });

  const taskPrincipal = await prisma.task.create({
    data: {
      projectId: projeto.id,
      title: "Pesquisa com usuários",
      status: "IN_PROGRESS",
      assigneeId: julia.id,
      priority: "HIGH",
      dueDate: daysFromNow(5),
      progressPercent: 50,
      position: 0,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        projectId: projeto.id,
        parentTaskId: taskPrincipal.id,
        title: "Roteiro de entrevistas",
        status: "DONE",
        assigneeId: julia.id,
        progressPercent: 100,
        position: 0,
      },
      {
        projectId: projeto.id,
        parentTaskId: taskPrincipal.id,
        title: "Entrevistar 8 usuários",
        status: "IN_PROGRESS",
        assigneeId: julia.id,
        progressPercent: 40,
        position: 1,
      },
    ],
  });

  await prisma.task.create({
    data: {
      projectId: projeto.id,
      title: "Protótipo de alta fidelidade",
      status: "TODO",
      assigneeId: pedro.id,
      priority: "MEDIUM",
      dueDate: daysAgo(2),
      progressPercent: 0,
      position: 1,
    },
  });

  // Projeto nascido de um item de roadmap, preservando o histórico de origem
  const roadmapPromovido = await prisma.roadmapItem.create({
    data: {
      teamId: marketing.id,
      title: "Programa de indicação de clientes",
      horizon: "MEDIUM",
      targetDate: daysFromNow(120),
      ownerId: carlos.id,
      createdById: carlos.id,
      priority: "MEDIUM",
      status: "INICIADO",
      lastActivityAt: daysAgo(2),
      createdAt: daysAgo(45),
    },
  });

  await prisma.project.create({
    data: {
      teamId: marketing.id,
      title: "Programa de indicação de clientes",
      ownerId: carlos.id,
      priority: "MEDIUM",
      status: "ACTIVE",
      roadmapItemId: roadmapPromovido.id,
      targetDate: daysFromNow(120),
      startedAt: daysAgo(10),
      lastActivityAt: daysAgo(2),
    },
  });

  console.log("Seed concluído.");
  console.log(`Usuário admin: ${admin.email} / senha123`);
  console.log("Demais usuários de teste (mesma senha): marina@example.com, carlos@example.com, julia@example.com, pedro@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
