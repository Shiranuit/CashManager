module.exports = {
  logger: {
    debug: true,
  },
  http: {
    host: 'localhost',
    port: 4000,
    cors: {
      'Access-Control-Allow-Origin': [
        /^(http(s)?:\/\/)?tungsten\.ovh/,
        /^(http(s)?:\/\/)?localhost/,
      ],
    },
  },
  auth: {
    maxLoginAttempts: 3,  // Max attemps per seconds
    username: {
      minLength: 3,
    },
    password: {
      minLength: 8,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'verysecurepassword',
      algorithm: 'HS256',
    },
  },
  security: {
    firstAdmin: {
      email: process.env.ADMIN_EMAIL || 'admin',
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin',
      role: process.env.ADMIN_ROLE || 'super-manager',
    }
  },
  vault: {
    algorithm: 'sha256',
    salt: process.env.VAULT_SECRET || 'verysecurepassword',
    derivationRound: parseInt(process.env.DERIVATION_ROUND) || 100000,
  },
  postgres: {
    maxRetries: 60,
    retryDelay: '1s',
    host: process.env.DB_HOST || 'postgres',
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_USER_PASSWORD || 'postgres',
  },
  // Maximum requests per minutes
  rateLimits: {
    auth: {
      login: 3,
      register: 3,
    }
  },
  permissions: {
    anonymous: {
      auth: {
        login: true,
        logout: true,
        checkToken: true,
        register: true,
      },
    },
    user: {
      auth: {
        login: true,
        logout: true,
        checkToken: true,

        getMyUser: true,
        updateMyUser: true,
        updateMyPassword: true,
        deleteMyUser: true,
      },
    },
    'super-manager': {
      '*': {
        '*': true,
      }
    }
  }
};