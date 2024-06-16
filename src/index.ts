import fastify from "fastify";
import multipart from "@fastify/multipart";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { upload } from "upload";

export const main = async () => {
  const app = fastify({ trustProxy: true });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(multipart);
  await app.register(upload);

  app.listen({ port: 8080, host: "::" }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address} @ ${new Date().toISOString()}`);
  });

  const closeGracefully = async (signal: NodeJS.Signals) => {
    console.log(`Received signal to terminate: ${signal}`);

    // Docker default grace period is 10s
    await Promise.all([app.close()]);
    console.log("Gracefull cleanup complete");
    process.kill(process.pid, signal);
  };
  process.once("SIGINT", closeGracefully);
  process.once("SIGTERM", closeGracefully);
};

main();
