module.exports = {
  apps: [
    {
      name: "scan",
      script: "dist/scan/start.js",
      node_args: [],
      max_memory_restart: "4000M",
      instances: "1",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
