// @vitest-environment node
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, expect, test } from "vitest";

const fixtures: string[] = [];
afterEach(() => fixtures.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })));

function fixture() {
  const directory = mkdtempSync(resolve(tmpdir(), "bootstrap-purge-"));
  fixtures.push(directory);
  const root = resolve(directory, "cast-bootstrap5");
  const js = resolve(root, "javascript");
  const templates = resolve(root, "cast_bootstrap5/templates");
  const output = resolve(root, "cast_bootstrap5/static/cast_bootstrap5/css/bootstrap5/bootstrap.min.css");
  for (const path of [js, templates, resolve(output, ".."),
    resolve(directory, "django-cast/src/cast/templates"), resolve(directory, "django-cast/javascript/src")]) {
    mkdirSync(path, { recursive: true });
  }
  copyFileSync(resolve("purge-bootstrap.mjs"), resolve(js, "purge-bootstrap.mjs"));
  symlinkSync(resolve("node_modules"), resolve(js, "node_modules"), "dir");
  const input = resolve("node_modules/bootstrap/dist/css/bootstrap.min.css");
  const pristine = readFileSync(input);
  writeFileSync(output, pristine);
  const template = resolve(templates, "test.html");
  const build = () => {
    execFileSync(process.execPath, [resolve(js, "purge-bootstrap.mjs")], { stdio: "pipe" });
    return readFileSync(output, "utf8");
  };
  return { input, pristine, output, template, build };
}

test("a later purge restores newly used classes from the pinned pristine input", () => {
  const { input, pristine, output, template, build } = fixture();
  expect(JSON.parse(readFileSync(resolve("package.json"), "utf8")).devDependencies.bootstrap).toBe("5.3.8");
  writeFileSync(template, '<div class="p-1"></div>');
  expect(build()).not.toContain(".p-2{");
  writeFileSync(template, '<div class="p-1 p-2"></div>');
  const rebuilt = build();
  expect(rebuilt).toContain(".p-2{");
  expect(readFileSync(input)).toEqual(pristine);
  // A clean build needs neither a previous generated file nor network access.
  unlinkSync(output);
  expect(build()).toBe(rebuilt);
});
