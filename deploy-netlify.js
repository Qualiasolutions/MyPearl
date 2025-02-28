const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Netlify deployment preparation...');

// Ensure the .netlify directory exists
const netlifyDir = path.join(__dirname, '.netlify');
if (!fs.existsSync(netlifyDir)) {
  fs.mkdirSync(netlifyDir);
  console.log('Created .netlify directory');
}

// Check if the Netlify CLI is installed
exec('netlify -v', (error, stdout, stderr) => {
  if (error) {
    console.log('⚠️ Netlify CLI not found. Installing...');
    
    exec('npm install -g netlify-cli', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to install Netlify CLI:', error);
        return;
      }
      
      console.log('✅ Netlify CLI installed successfully');
      startDeployment();
    });
  } else {
    console.log('✅ Netlify CLI is already installed');
    startDeployment();
  }
});

function startDeployment() {
  console.log('📦 Preparing for deployment...');
  
  // Run build command
  exec('next build', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Build failed:', error);
      return;
    }
    
    console.log('✅ Build completed successfully');
    console.log('📤 Ready for deployment!');
    console.log('\nTo deploy, run one of the following commands:');
    console.log('• netlify deploy --prod (for production)');
    console.log('• netlify deploy (for preview)\n');
    
    console.log('If this is your first deployment, you may need to run:');
    console.log('• netlify login');
    console.log('• netlify init\n');
  });
} 