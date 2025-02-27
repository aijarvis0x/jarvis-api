module.exports = {
  apps: [
    {
      name: "worker-gen-agent",
      script: "dist/core-ai/start-ai-generate.job.js",
      node_args: [],
      max_memory_restart: "10000M",
      instances: "max",
      exec_mode: "cluster",
      kill_timeout: 1000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
