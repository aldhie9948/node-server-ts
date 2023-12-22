module.exports = {
  apps: [
    {
      name: "Node Server",
      script: "./index.js",
      env_production: {
        NODE_ENV: "production",
        MYSQL_USER: "root",
        MYSQL_PASSWORD: "nkp123",
      },
      env_development: {
        NODE_ENV: "development",
        MYSQL_USER: "root",
        MYSQL_PASSWORD: "nkp123",
      },
    },
  ],
};
