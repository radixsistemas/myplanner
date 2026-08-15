import { stallCheckJob } from "./stallCheck.job";
import { prisma } from "../lib/prisma";

stallCheckJob()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
