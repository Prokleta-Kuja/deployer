import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import path from "path";
import { z } from "zod";
import util from "util";
import { pipeline } from "stream";
import tar from "tar-fs";
import zlib from "zlib";
import { isDev, passwordPaths } from "env";
import { unlink, rename } from "fs/promises";

const pump = util.promisify(pipeline);
const sitesDir = isDev ? "/workspaces/deployer/dist/sites" : "/sites";
export const upload = async (fastify: FastifyInstance, _options: Object) => {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/upload",
    schema: {
      response: {
        200: z.string(),
        400: z.string(),
        401: z.string(),
      },
    },
    handler: async (req, res) => {
      const header = req.headers.authorization;
      if (!header) return res.code(401).send("Authorization header not found");

      const authParts = header.split(" ");
      if (authParts.length !== 2 || authParts[0] !== "api-key")
        return res.code(401).send("Authorization scheme not supported");

      const sitePath = passwordPaths.get(authParts[1]);
      if (!sitePath) return res.code(401).send("Failed to authenticate");

      console.log(`Received a valid request for ${sitePath}`);

      const parts = req.files({ limits: { fileSize: 1024 * 1024 * 1000 } }); // 1GB //TODO: move to env
      for await (const part of parts) {
        const siteTempDir = path.join(sitesDir, sitePath);
        const siteDir = path.join(sitesDir, sitePath);
        const parsedPath = path.parse(part.filename);

        try {
          if (part.filename.endsWith(".tar.gz")) {
            await pump(
              part.file,
              zlib.createGunzip(),
              tar.extract(siteTempDir)
            );
            await unlink(siteDir).catch(() => {});
            await rename(siteTempDir, siteDir);
            console.log(`Deployed ${sitePath}`);
          } else
            return res
              .code(400)
              .send(`Unsupported file extension '${parsedPath.ext}'`);
        } catch (error) {
          console.error("Failed to save upload");
          unlink(siteTempDir).catch(() => {});
        }

        res.code(200).send("Deployed");

        break;
      }

      res.code(500).send("Something went wrong");
    },
  });
};
