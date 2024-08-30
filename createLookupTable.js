const { spawn } = require('child_process');

function runCLIBot() {
  return new Promise((resolve, reject) => {
    const bot = spawn('npm', ['run', 'start']);

    const sendInput = (input) => {
      setTimeout(() => {
        bot.stdin.write(input + '\n');
      }, 2000);
    };

    bot.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Choose an option:')) {
        sendInput('3');
        setTimeout(() => {
          bot.kill();
          resolve();
        }, 60000);
      }
    });

    bot.on('error', (error) => {
      reject(error);
    });
  });
}

runCLIBot().then(() => console.log('createLookupTable completed')).catch(console.error);