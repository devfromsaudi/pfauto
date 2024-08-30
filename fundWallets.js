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
        sendInput('2');
      } else if (output.includes('Choose an option:')) {
        sendInput('1');
      } else if (output.includes('Do you wish to send unique amounts to each wallet? (y/n):')) {
        sendInput('n');
      } else if (output.includes('Enter buy amount (SOL) for all wallets:')) {
        sendInput('0.001');
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

runCLIBot().then(() => console.log('fundWallets completed')).catch(console.error);