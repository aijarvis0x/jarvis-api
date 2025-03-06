module.exports = {
  apps: [
    {
      name: "scan",
      script: "dist/scan/scan.js",
      node_args: [],
      max_memory_restart: "4000M",
      instances: "1",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
