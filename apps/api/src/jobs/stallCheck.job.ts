import { runStallCheck } from "../modules/stall-detection/stall-engine.service";

export async function stallCheckJob() {
  console.log("[job:stallCheck] iniciando verificação de estagnação...");
  const result = await runStallCheck();
  console.log(
    `[job:stallCheck] concluído: ${result.checked} itens verificados, ${result.stalled} parados, ${result.notified} notificações enviadas.`,
  );
  return result;
}
