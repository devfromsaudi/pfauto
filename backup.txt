const pty = require('node-pty');

function startBot() {
  let transactionSuccessful = false;
  let stage = 0;

  function runBot() {
    const botProcess = pty.spawn('npm', ['run', 'start'], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env
    });

    let buffer = '';
    let inputSent = false;
    const inputSequence = stage === 0 ? ['2', '1', 'n', '1', '12'] : ['5'];
    let currentInputIndex = 0;

    botProcess.on('data', (data) => {
      process.stdout.write(data);
      buffer += data;

      if (buffer.includes('Transaction successful 🥳')) {
        transactionSuccessful = true;
      }

      if (!inputSent) {
        if (buffer.includes('Choose an option (1-8):')) {
          if (stage === 0) {
            if (currentInputIndex === 0) {
              sendInput('2');
            } else if (currentInputIndex === 5) {
              sendInput('3');
            }
          } else if (stage === 1) {
            sendInput('5');
          }
        } else if (buffer.includes('Choose an option (1-12):') && stage === 0) {
          if (currentInputIndex === 1 || currentInputIndex === 4) {
            sendInput(inputSequence[currentInputIndex]);
          }
        } else if (buffer.includes('Do you wish to send unique amounts to each wallet?') && stage === 0) {
          sendInput(inputSequence[currentInputIndex]);
        } else if (buffer.includes('Enter funding amount (SOL) for all wallets:') && stage === 0) {
          sendInput(inputSequence[currentInputIndex]);
        }
      }
    });

    function sendInput(input) {
      inputSent = true;
      setTimeout(() => {
        botProcess.write(input);
        setTimeout(() => {
          botProcess.write('\r');
          buffer = '';
          inputSent = false;
          currentInputIndex++;
        }, 3000);
      }, 3000);
    }

    botProcess.on('exit', (exitCode) => {
      console.log(`Bot process exited with code ${exitCode}`);
      if (stage === 0 && !transactionSuccessful) {
        console.log('Restarting bot for Create Lookup Table...');
        runBot();
      } else if (stage === 0 && transactionSuccessful) {
        console.log('Lookup Table created successfully. Moving to Launch UI...');
        stage = 1;
        runBot();
      } else if (stage === 1) {
        console.log('Bot process completed.');
        process.exit();
      }
    });

    process.on('SIGINT', () => {
      botProcess.kill();
      process.exit();
    });
  }

  runBot();
}

startBot();