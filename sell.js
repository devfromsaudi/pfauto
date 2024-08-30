const { spawn } = require('child_process');

function runCLIBot() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const bot = spawn('npm', ['run', 'start']);

      const sendInput = (input) => {
        setTimeout(() => {
          bot.stdin.write(input + '\n');
        }, 2000);
      };

      bot.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Choose an option:')) {
          sendInput('5');
        } else if (output.includes('Choose an option:')) {
          sendInput('1');
          setTimeout(() => {
            bot.kill();
            resolve();
          }, 30000);
        }
      });

      bot.on('error', (error) => {
        reject(error);
      });
    }, 120000);
  });
}

runCLIBot().then(() => console.log('sell completed')).catch(console.error);