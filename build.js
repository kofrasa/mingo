const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const glob = require("glob").globSync;
const packageJson = require("./package.json");

const OUT_DIR = path.resolve("build");
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
    ["**/*.js", "**/*.ts", "**/*.json"]
  );

  // clear all scripts
  packageJson.scripts = {};
  packageJson.devDependencies = {};

  // add exports explicitly
  const files = Array.from(
    new Set(
      glob("./src/**/*.ts")
        .filter(s => !s.includes("_"))
        .map(s => {
          const d = path.dirname(s);
          if (d === "src") return path.basename(s).slice(0, -3);
          if (d.includes("init")) return s.slice(4, -3);
          return d.slice(4);
        })
    )
  );

  // console.log(files);

  packageJson.exports = {
    "./package.json": "./package.json"
  };

  files.forEach(name => {
    const [outFile, key] =
      name == "index" // root
        ? [name, "."]
        : name.startsWith("init") // side-effects
        ? [name, `./${name}`]
        : !name.includes("/") // top-level
        ? [name, `./${name}`]
        : [`${name}/index`, `./${name}`]; //nested parents

    const typesPath = `./dist/types/${outFile}.d.ts`;
    const cjsPath = `./dist/cjs/${outFile}.js`;
    const esmPath = `./dist/esm/${outFile}.js`;

    if (key != ".") {
      // create subpackage package.json
      const subPackagePath = path.join(OUT_DIR, name);
      if (!fs.existsSync(subPackagePath)) {
        fs.mkdirSync(subPackagePath, { recursive: true });
      }
      const subPackageJson = {
        main: path.relative(subPackagePath, path.join(OUT_DIR, cjsPath)),
        module: path.relative(subPackagePath, path.join(OUT_DIR, esmPath)),
        types: path.relative(subPackagePath, path.join(OUT_DIR, typesPath)),
        sideEffects: outFile.startsWith("init")
      };
      fs.writeFileSync(
        path.join(subPackagePath, "package.json"),
        JSON.stringify(subPackageJson, null, 2)
      );
    }

    packageJson.exports[key] = {
      types: typesPath,
      node: cjsPath,
      require: cjsPath,
      default: esmPath
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
      stdio: "inherit"
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
