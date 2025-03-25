module.exports = {
  apps: [
    {
      name: "rescan",
      script: "dist/scan/rescan.js",
      node_args: [],
      max_memory_restart: "1000M",
      instances: "1",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
