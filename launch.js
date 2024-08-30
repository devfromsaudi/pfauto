const { spawn } = require('child_process');
const fs = require('fs');

function runCLIBot() {
  return new Promise((resolve, reject) => {
    const bot = spawn('npm', ['run', 'start']);

    const sendInput = (input) => {
      setTimeout(() => {
        bot.stdin.write(input + '\n');
      }, 2000);
    };

    let tokenMint = '';

    bot.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Choose an option:')) {
        sendInput('5');
      } else if (output.includes('Choose an option:')) {
        sendInput('7');
      } else if (output.includes('Enter Token Mint:')) {
        const contract = fs.readFileSync('@contract.txt', 'utf8').split('\n')[0];
        fs.writeFileSync('@contract.txt', fs.readFileSync('@contract.txt', 'utf8').split('\n').slice(1).join('\n'));
        sendInput(contract);
        tokenMint = contract;
        bot.kill();
        runSecondBot();
      }
    });

    function runSecondBot() {
      const secondBot = spawn('npm', ['run', 'start']);

      secondBot.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Choose an option:')) {
          sendInput('5');
        } else if (output.includes('Choose an option:')) {
          sendInput('3');
          setTimeout(() => {
            secondBot.kill();
            console.log(`Token Mint: ${tokenMint}`);
            resolve();
          }, 30000);
        }
      });

      secondBot.on('error', (error) => {
        reject(error);
      });
    }

    bot.on('error', (error) => {
      reject(error);
    });
  });
}

runCLIBot().then(() => console.log('launch completed')).catch(console.error);