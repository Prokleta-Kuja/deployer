import { env } from "process";

interface ISite {
  path: string;
  pass: string;
}
export let isDev = false;
export const sites: Map<string, ISite> = new Map();
export const passwordPaths: Map<string, string> = new Map();

const parseEnv = () => {
  const keys = Object.keys(process.env);
  const temp: Map<string, Partial<ISite>> = new Map();
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.startsWith("SITE_")) {
      const [_, prop, name] = key.split("_");
      const site = temp.get(name);
      if (prop === "PASS") temp.set(name, { pass: env[key], ...site });
      if (prop === "PATH") temp.set(name, { path: env[key], ...site });
    }
    if (key === "IS_DEV") isDev = true;
  }

  temp.forEach((v, k) => {
    if (v.pass && v.path) {
      sites.set(k, { pass: v.pass, path: v.path });
      if (passwordPaths.has(v.pass))
        throw new Error("Same password reused for multiple sites");
      passwordPaths.set(v.pass, v.path);
    }
  });
};

parseEnv();
