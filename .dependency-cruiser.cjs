// Deep-module boundaries for the backend. Each subfolder of src/ is private to
// one entry file; importing it from anywhere else is a violation.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "content-only-via-data",
      comment: "src/content/* is the curriculum implementation. Import lessons through src/data.ts, which is its entry point.",
      severity: "error",
      from: { pathNot: "^(src/data\\.ts|src/content/)" },
      to: { path: "^src/content/" },
    },
    {
      name: "http-layers-only-via-app",
      comment: "src/routes/* and src/middleware/* are the HTTP surface. Only src/app.ts wires them; domain modules must not depend on them. Tests may import them directly.",
      severity: "error",
      from: { pathNot: "^(src/app\\.ts|src/routes/|src/middleware/|tests/)" },
      to: { path: "^src/(routes|middleware)/" },
    },
    {
      name: "no-circular",
      comment: "No dependency cycles. Extract the shared piece into its own module.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { extensions: [".ts", ".js", ".json"] },
  },
};
