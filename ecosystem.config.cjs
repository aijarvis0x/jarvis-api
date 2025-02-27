module.exports = {
  apps: [
    {
      name: "api",
      script: "dist/server.js",
      node_args: [],
      max_memory_restart: "10000M",
      instances: "-1",
      exec_mode: "cluster",
      kill_timeout: 1000,
      env: {
        NODE_ENV: "production",
      },
    }
  ],
}
