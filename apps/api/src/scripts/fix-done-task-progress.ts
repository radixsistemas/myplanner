import { prisma } from "../lib/prisma";

/**
 * Repara dados legados de tarefas marcadas como concluídas (DONE) cujo progressPercent
 * ficou desatualizado (bug corrigido em tasks.service.ts: editar uma tarefa pelo modal e
 * mudar o status para "Concluída" sem mexer no slider de progresso enviava o valor antigo
 * de progressPercent, sobrescrevendo os 100% esperados). Idempotente: pode ser rodado
 * quantas vezes for preciso.
 */
async function main() {
  const staleTasks = await prisma.task.findMany({
    where: { status: "DONE", NOT: { progressPercent: 100 } },
    select: {
      id: true,
      title: true,
      progressPercent: true,
      parentTaskId: true,
      project: { select: { title: true } },
    },
  });

  if (staleTasks.length === 0) {
    console.log("Nenhuma tarefa concluída com progresso desatualizado encontrada.");
    return;
  }

  console.log(`Corrigindo ${staleTasks.length} tarefa(s) concluída(s) com progresso diferente de 100%:`);
  for (const task of staleTasks) {
    console.log(`  - [${task.project.title}] ${task.title}: ${task.progressPercent}% -> 100%`);
  }

  await prisma.task.updateMany({
    where: { id: { in: staleTasks.map((t) => t.id) } },
    data: { progressPercent: 100 },
  });

  const parentIds = [...new Set(staleTasks.map((t) => t.parentTaskId).filter((id): id is string => !!id))];
  for (const parentId of parentIds) {
    const agg = await prisma.task.aggregate({ where: { parentTaskId: parentId }, _avg: { progressPercent: true } });
    await prisma.task.update({
      where: { id: parentId },
      data: { progressPercent: Math.round(agg._avg.progressPercent ?? 0) },
    });
  }

  console.log(
    `Pronto: ${staleTasks.length} tarefa(s) corrigida(s), ${parentIds.length} tarefa(s)-pai recalculada(s).`,
  );
  console.log(
    "O progresso exibido nos projetos é calculado dinamicamente a partir das tarefas de topo, então já refletirá a correção automaticamente.",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
