const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const packageJson = require("./package.json");

const OUT_DIR = path.resolve("dist");
const npmArgs = process.argv.slice(2);

// .npmignore
const NPM_IGNORE = [".*", "*.tgz", "node_modules", "package-lock.json"];

/**
 * Create module in OUT_DIR
 */
function createModule() {
  console.log("Creating module at " + OUT_DIR);

  // ensure directory exists
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  // write ignore file
  fs.writeFileSync(path.join(OUT_DIR, ".npmignore"), NPM_IGNORE.join("\n"));

  // copy all the allowed files to the lib directory
  packageJson.files = ["LICENSE", "README.md", "CHANGELOG.md"].reduce(
    (files, p) => {
      fs.copyFileSync(path.resolve(p), path.join(OUT_DIR, p));
      files.push(p);
      return files;
    },
    ["**/*.js", "**/*.ts"]
  );

  // clear all scripts
  packageJson.scripts = {};
  packageJson.devDependencies = {};

  // add exports explicitly
  const files = cp
    .spawnSync("find", ["src", "-type", "f"])
    .stdout.toString()
    .split("\n");

  packageJson.exports = {
    "./package.json": "./package.json",
  };

  files.forEach((s) => {
    s = s.replace(/^src/, ".").slice(0, -3);
    if (s.endsWith("_internal")) return;
    const typesPath = `./types/${s.slice(2)}.d.ts`;
    const libPath = `./lib/${s.slice(2)}.js`;
    const esPath = `./es/${s.slice(2)}.js`;
    const key = s.endsWith("/index") ? s.slice(0, -6) : s;
    if (!key) return;

    // create subpackage package.json
    if (key !== ".") {
      const subPackagePath = path.join(OUT_DIR, key);
      if (!fs.existsSync(subPackagePath)) {
        fs.mkdirSync(subPackagePath, { recursive: true });
      }
      const subPackageJson = {
        "main": path.relative(subPackagePath, path.join(OUT_DIR, libPath)),
        "module": path.relative(subPackagePath, path.join(OUT_DIR, esPath)),
        "es2015": path.relative(subPackagePath, path.join(OUT_DIR, esPath)),
        "jsnext:main": path.relative(subPackagePath, path.join(OUT_DIR, esPath)),
        "types": path.relative(subPackagePath, path.join(OUT_DIR, typesPath)),
        "sideEffects": false
      };
      fs.writeFileSync(
        path.join(subPackagePath, "package.json"),
        JSON.stringify(subPackageJson, null, 2)
      );
    }

    packageJson.exports[key] = {
      types: typesPath,
      node: libPath,
      require: libPath,
      es2015: esPath,
      default: esPath,
    };
  });

  const data = JSON.stringify(packageJson, null, 2);

  // write new package.json for lib
  fs.writeFileSync(path.join(OUT_DIR, "package.json"), data);
}

function main() {
  createModule();

  if (npmArgs.length) {
    // execute within lib dir
    console.log("\nExecuting command:", `npm ${npmArgs.join(" ")}`, "\n");

    // execute command
    cp.spawnSync("npm", npmArgs, {
      cwd: OUT_DIR,
      env: process.env,
      stdio: "inherit",
    });

    console.log("\nCompleted command\n");

    // if we created a tar file, copy to parent directory
    let tarball = packageJson.name + "-" + packageJson.version + ".tgz";
    let tarballPath = path.join(OUT_DIR, tarball);
    if (fs.existsSync(tarballPath)) {
      console.log("Copying", tarball, "to correct folder");
      fs.renameSync(tarballPath, path.join(path.dirname(OUT_DIR), tarball));
    }
  }
}

main();
