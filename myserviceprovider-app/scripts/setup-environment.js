#!/usr/bin/env node
// Environment Variables Setup and Management for ServiceFlow AI

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Environment variable categories
const ENV_CATEGORIES = {
  CORE: {
    name: 'Core Application',
    vars: {
      ENVIRONMENT: { 
        description: 'Application environment', 
        default: 'development',
        options: ['development', 'staging', 'production']
      },
      AUTH_ENABLED: { 
        description: 'Enable authentication', 
        default: 'false',
        type: 'boolean'
      },
      ADMIN_EMAIL: { 
        description: 'Admin email address', 
        required: true,
        example: 'serviceflowagi@gmail.com'
      }
    }
  },
  CLOUDFLARE: {
    name: 'Cloudflare Services',
    vars: {
      CLOUDFLARE_ACCOUNT_HASH: { 
        description: 'Cloudflare account hash for R2 public URLs', 
        required: true,
        example: 'abcd1234'
      },
      CLOUDFLARE_API_TOKEN: { 
        description: 'Cloudflare API token for management', 
        required: true,
        sensitive: true
      },
      CLOUDFLARE_ZONE_ID: { 
        description: 'Zone ID for domain management', 
        required: true
      },
      CLOUDFLARE_ACCESS_TEAM_NAME: { 
        description: 'Zero Trust team name', 
        default: 'serviceflow-ai'
      },
      CLOUDFLARE_ACCESS_AUDIENCE: { 
        description: 'Zero Trust audience', 
        default: 'serviceflow-audience'
      }
    }
  },
  AI_SERVICES: {
    name: 'AI Generation Services',
    vars: {
      KIE_AI_API_KEY: { 
        description: 'KIE.AI API key for premium image/video generation', 
        sensitive: true,
        optional: true
      },
      OPENAI_API_KEY: { 
        description: 'OpenAI API key for advanced AI features', 
        sensitive: true,
        optional: true
      }
    }
  },
  WEB3_BLOCKCHAIN: {
    name: 'Web3 & Blockchain',
    vars: {
      THIRDWEB_CLIENT_ID: { 
        description: 'Thirdweb client ID for frontend', 
        required: true
      },
      THIRDWEB_SECRET_KEY: { 
        description: 'Thirdweb secret key for backend operations', 
        required: true,
        sensitive: true
      },
      SONIC_PRIVATE_KEY: { 
        description: 'Private key for Sonic blockchain operations', 
        required: true,
        sensitive: true,
        warning: 'NEVER commit this to version control!'
      },
      SONIC_RPC_URL: { 
        description: 'Sonic blockchain RPC URL', 
        default: 'https://rpc.testnet.soniclabs.com'
      },
      SONIC_CHAIN_ID: { 
        description: 'Sonic blockchain chain ID', 
        default: '64165'
      },
      INFURA_PROJECT_ID: { 
        description: 'Infura project ID for Ethereum interactions', 
        optional: true
      },
      ALCHEMY_API_KEY: { 
        description: 'Alchemy API key for blockchain data', 
        optional: true
      }
    }
  },
  PAYMENTS: {
    name: 'Payment Processing',
    vars: {
      STRIPE_SECRET_KEY: { 
        description: 'Stripe secret key for fiat payments', 
        sensitive: true,
        optional: true
      },
      STRIPE_WEBHOOK_SECRET: { 
        description: 'Stripe webhook signing secret', 
        sensitive: true,
        optional: true
      },
      CREEM_API_KEY: { 
        description: 'Creem.io API key for crypto payments', 
        sensitive: true,
        optional: true
      },
      CREEM_WEBHOOK_SECRET: { 
        description: 'Creem.io webhook signing secret', 
        sensitive: true,
        optional: true
      }
    }
  },
  EXTERNAL_SERVICES: {
    name: 'External Services',
    vars: {
      MONGODB_URI: { 
        description: 'MongoDB connection string for user data', 
        required: true,
        sensitive: true,
        example: 'mongodb://localhost:27017/serviceflow'
      },
      SENDGRID_API_KEY: { 
        description: 'SendGrid API key for email services', 
        optional: true,
        sensitive: true
      },
      GOOGLE_CLIENT_ID: { 
        description: 'Google OAuth client ID', 
        optional: true
      },
      GOOGLE_CLIENT_SECRET: { 
        description: 'Google OAuth client secret', 
        optional: true,
        sensitive: true
      }
    }
  },
  DEVELOPMENT: {
    name: 'Development & Testing',
    vars: {
      ADMIN_API_KEY: { 
        description: 'Admin API key for development', 
        default: 'admin_sk_dev_12345',
        sensitive: true
      },
      AGNO_API_KEY: { 
        description: 'Agno API key for agent services', 
        default: 'ag_dev_12345',
        sensitive: true
      }
    }
  }
};

console.log('⚙️  ServiceFlow AI Environment Setup');
console.log('='.repeat(50));

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to generate secure random keys
function generateSecureKey(length = 64) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Function to validate environment variable values
function validateEnvVar(key, value, config) {
  if (!value && config.required) {
    return { valid: false, error: `${key} is required` };
  }
  
  if (config.type === 'boolean' && value && !['true', 'false'].includes(value.toLowerCase())) {
    return { valid: false, error: `${key} must be 'true' or 'false'` };
  }
  
  if (config.options && value && !config.options.includes(value)) {
    return { valid: false, error: `${key} must be one of: ${config.options.join(', ')}` };
  }
  
  return { valid: true };
}

// Function to interactively set up environment variables
async function interactiveSetup() {
  console.log('\n🔧 Interactive Environment Setup');
  console.log('This will guide you through setting up all required environment variables.\n');
  
  const envVars = {};
  
  for (const [categoryKey, category] of Object.entries(ENV_CATEGORIES)) {
    console.log(`\n📂 ${category.name}`);
    console.log('-'.repeat(40));
    
    for (const [varKey, config] of Object.entries(category.vars)) {
      let prompt = `${varKey}`;
      if (config.description) {
        prompt += ` (${config.description})`;
      }
      if (config.default) {
        prompt += ` [${config.default}]`;
      }
      if (config.example) {
        prompt += ` (e.g., ${config.example})`;
      }
      if (config.optional) {
        prompt += ' (optional)';
      }
      prompt += ': ';
      
      if (config.warning) {
        console.log(`⚠️  WARNING: ${config.warning}`);
      }
      
      let value = await askQuestion(prompt);
      
      // Use default if no value provided
      if (!value && config.default) {
        value = config.default;
      }
      
      // Generate secure key if needed
      if (!value && config.sensitive && !config.optional) {
        console.log('Generating secure random key...');
        value = generateSecureKey();
      }
      
      // Validate the value
      const validation = validateEnvVar(varKey, value, config);
      if (!validation.valid) {
        console.log(`❌ ${validation.error}`);
        // Ask again
        value = await askQuestion(`Please enter a valid value for ${varKey}: `);
      }
      
      if (value) {
        envVars[varKey] = value;
        if (config.sensitive) {
          console.log(`✅ ${varKey} set (hidden for security)`);
        } else {
          console.log(`✅ ${varKey} = ${value}`);
        }
      } else if (!config.optional) {
        console.log(`⚠️  ${varKey} not set (required variable)`);
      }
    }
  }
  
  return envVars;
}

// Function to create .env file
function createEnvFile(envVars, filename = '.env') {
  console.log(`\n📝 Creating ${filename} file...`);
  
  let envContent = `# ServiceFlow AI Environment Variables
# Generated on ${new Date().toISOString()}
# 
# 🚨 SECURITY WARNING: Never commit this file to version control!
# Add this file to your .gitignore
#

`;
  
  for (const [categoryKey, category] of Object.entries(ENV_CATEGORIES)) {
    envContent += `# ${category.name}\n`;
    
    for (const [varKey, config] of Object.entries(category.vars)) {
      if (config.description) {
        envContent += `# ${config.description}\n`;
      }
      if (config.warning) {
        envContent += `# WARNING: ${config.warning}\n`;
      }
      
      const value = envVars[varKey] || config.default || '';
      envContent += `${varKey}=${value}\n`;
      envContent += '\n';
    }
    
    envContent += '\n';
  }
  
  const envPath = path.join(__dirname, '..', filename);
  fs.writeFileSync(envPath, envContent);
  
  console.log(`✅ Environment file created at: ${envPath}`);
  return envPath;
}

// Function to set Wrangler secrets
async function setWranglerSecrets(envVars) {
  console.log('\n🔐 Setting Wrangler secrets...');
  
  const sensitiveVars = [];
  for (const [categoryKey, category] of Object.entries(ENV_CATEGORIES)) {
    for (const [varKey, config] of Object.entries(category.vars)) {
      if (config.sensitive && envVars[varKey]) {
        sensitiveVars.push(varKey);
      }
    }
  }
  
  console.log(`Found ${sensitiveVars.length} sensitive variables to set as secrets`);
  
  for (const varKey of sensitiveVars) {
    try {
      console.log(`Setting secret: ${varKey}`);
      
      // Use wrangler secret put command
      const command = `echo "${envVars[varKey]}" | wrangler secret put ${varKey}`;
      execSync(command, { stdio: 'inherit' });
      
      console.log(`✅ Secret ${varKey} set successfully`);
    } catch (error) {
      console.error(`❌ Failed to set secret ${varKey}:`, error.message);
    }
  }
}

// Function to validate current environment
function validateEnvironment() {
  console.log('\n✅ Validating current environment...');
  
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ No .env file found');
    return false;
  }
  
  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  let allValid = true;
  let missingRequired = [];
  
  for (const [categoryKey, category] of Object.entries(ENV_CATEGORIES)) {
    console.log(`\n📂 ${category.name}:`);
    
    for (const [varKey, config] of Object.entries(category.vars)) {
      const value = envVars[varKey];
      const validation = validateEnvVar(varKey, value, config);
      
      if (!validation.valid) {
        console.log(`  ❌ ${varKey}: ${validation.error}`);
        allValid = false;
        if (config.required) {
          missingRequired.push(varKey);
        }
      } else if (value) {
        if (config.sensitive) {
          console.log(`  ✅ ${varKey}: Set (hidden)`);
        } else {
          console.log(`  ✅ ${varKey}: ${value}`);
        }
      } else if (config.optional) {
        console.log(`  ℹ️  ${varKey}: Not set (optional)`);
      } else {
        console.log(`  ⚠️  ${varKey}: Not set`);
      }
    }
  }
  
  if (allValid) {
    console.log('\n🎉 All environment variables are valid!');
  } else {
    console.log(`\n⚠️  Environment validation failed. Missing required: ${missingRequired.join(', ')}`);
  }
  
  return allValid;
}

// Function to display environment summary
function showEnvironmentSummary() {
  console.log('\n📊 Environment Variables Summary');
  console.log('='.repeat(50));
  
  let totalVars = 0;
  let requiredVars = 0;
  let optionalVars = 0;
  let sensitiveVars = 0;
  
  for (const [categoryKey, category] of Object.entries(ENV_CATEGORIES)) {
    console.log(`\n📂 ${category.name}:`);
    
    const categoryVars = Object.entries(category.vars);
    totalVars += categoryVars.length;
    
    categoryVars.forEach(([varKey, config]) => {
      let status = '  ';
      if (config.required) {
        status += '🔴 Required';
        requiredVars++;
      } else {
        status += '🟡 Optional';
        optionalVars++;
      }
      
      if (config.sensitive) {
        status += ' 🔒 Sensitive';
        sensitiveVars++;
      }
      
      console.log(`  ${varKey}: ${config.description} ${status}`);
    });
  }
  
  console.log(`\n📈 Summary:`);
  console.log(`  Total variables: ${totalVars}`);
  console.log(`  Required: ${requiredVars}`);
  console.log(`  Optional: ${optionalVars}`);
  console.log(`  Sensitive: ${sensitiveVars}`);
}

// Main setup function
async function mainSetup() {
  try {
    console.log('🚀 Starting environment setup...\n');
    
    const mode = await askQuestion('Choose setup mode:\n1. Interactive setup\n2. Create template only\n3. Validate current environment\n4. Show summary\nEnter choice (1-4): ');
    
    switch (mode) {
      case '1':
        const envVars = await interactiveSetup();
        createEnvFile(envVars);
        
        const setSecrets = await askQuestion('\nDo you want to set Wrangler secrets now? (y/n): ');
        if (setSecrets.toLowerCase() === 'y') {
          await setWranglerSecrets(envVars);
        }
        break;
        
      case '2':
        createEnvFile({}, '.env.template');
        console.log('✅ Template created! Fill in the values and rename to .env');
        break;
        
      case '3':
        validateEnvironment();
        break;
        
      case '4':
        showEnvironmentSummary();
        break;
        
      default:
        console.log('Invalid choice. Please run the script again.');
    }
    
    console.log('\n🎉 Environment setup completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review your .env file and ensure all values are correct');
    console.log('2. Add .env to your .gitignore file');
    console.log('3. Set up Wrangler secrets for production deployment');
    console.log('4. Test your configuration with the application');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      mainSetup();
      break;
    case 'validate':
      validateEnvironment();
      process.exit(0);
      break;
    case 'summary':
      showEnvironmentSummary();
      process.exit(0);
      break;
    case 'template':
      createEnvFile({}, '.env.template');
      console.log('✅ Template created!');
      process.exit(0);
      break;
    case 'help':
    default:
      console.log('ServiceFlow AI Environment Setup');
      console.log('');
      console.log('Commands:');
      console.log('  setup    - Interactive environment setup');
      console.log('  validate - Validate current environment');
      console.log('  summary  - Show environment variables summary');
      console.log('  template - Create .env template');
      console.log('  help     - Show this help message');
      console.log('');
      console.log('Usage: node scripts/setup-environment.js [command]');
      process.exit(0);
      break;
  }
}

module.exports = {
  ENV_CATEGORIES,
  createEnvFile,
  validateEnvironment,
  setWranglerSecrets,
  showEnvironmentSummary
};