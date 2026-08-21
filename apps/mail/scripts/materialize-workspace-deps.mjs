/**
 * Replace file: junctions with real copies so Turbopack (app-scoped root)
 * can resolve @rukny/* without following symlinks outside the project.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appDir, "../..");

const workspaceDeps = [
  { name: "@rukny/auth", src: "packages/auth" },
  { name: "@rukny/thmanyah-font", src: "packages/Thmanyah-Font-Family" },
];

/** Nested deps that Turbopack cannot resolve from the app root when auth is materialized. */
const authNestedDeps = ["jose"];

function isReparsePoint(targetPath) {
  try {
    const stat = fs.lstatSync(targetPath);
    return (
      stat.isSymbolicLink() ||
      (process.platform === "win32" &&
        stat.isDirectory() &&
        (stat.mode & 0o170000) === 0o120000)
    );
  } catch {
    return false;
  }
}

function materializePackage({ name, src }) {
  const source = path.join(repoRoot, src);
  const target = path.join(appDir, "node_modules", name);

  if (!fs.existsSync(source)) {
    console.warn(`[materialize-workspace-deps] skip ${name}: missing ${source}`);
    return false;
  }

  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink() || isReparsePoint(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    } else if (stat.isDirectory()) {
      const marker = path.join(target, "package.json");
      if (fs.existsSync(marker) && !isReparsePoint(target)) {
        console.log(`[materialize-workspace-deps] keep ${name} (already materialized)`);
        return true;
      }
      fs.rmSync(target, { recursive: true, force: true });
    } else {
      fs.rmSync(target, { force: true });
    }
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, dereference: true });
  console.log(`[materialize-workspace-deps] copied ${name}`);
  return true;
}

let ok = true;
for (const dep of workspaceDeps) {
  if (!materializePackage(dep)) ok = false;
}

const authDir = path.join(appDir, "node_modules", "@rukny", "auth");
for (const name of authNestedDeps) {
  const source = path.join(appDir, "node_modules", name);
  const target = path.join(authDir, "node_modules", name);
  if (!fs.existsSync(source)) {
    console.warn(`[materialize-workspace-deps] skip nested ${name}: missing ${source}`);
    ok = false;
    continue;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
  fs.cpSync(source, target, { recursive: true, dereference: true });
  console.log(`[materialize-workspace-deps] nested ${name} -> @rukny/auth`);
}

if (!ok) {
  process.exit(1);
}
