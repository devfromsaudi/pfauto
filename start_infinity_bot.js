const pty = require('node-pty');
const fs = require('fs');

function startBot() {
  let transactionSuccessful = false;
  let stage = 0;
  let addresses = fs.readFileSync('kingofthehill.txt', 'utf8').split('\n').filter(Boolean);
  let stage0Inputs = ['2', '1', 'n', '1', '12', '3'];
  let stage1Inputs = ['5', '10', '3', '11'];
  let currentStage0Input = 0;
  let currentStage1Input = 0;
  let waitingForTimeout = false;

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

    botProcess.on('data', (data) => {
      process.stdout.write(data);
      buffer += data;

      if (buffer.includes('Transaction successful 🥳')) {
        transactionSuccessful = true;
      }

      if (!inputSent && !waitingForTimeout) {
        if (buffer.includes('Choose an option (1-8):')) {
          if (stage === 0) {
            sendInput(stage0Inputs[currentStage0Input]);
            currentStage0Input++;
          } else if (stage === 1) {
            sendInput(stage1Inputs[currentStage1Input]);
            currentStage1Input++;
          }
        } else if (buffer.includes('Choose an option (1-12):') && stage === 0) {
          sendInput(stage0Inputs[currentStage0Input]);
          currentStage0Input++;
        } else if (buffer.includes('Do you wish to send unique amounts to each wallet?') && stage === 0) {
          sendInput(stage0Inputs[currentStage0Input]);
          currentStage0Input++;
        } else if (buffer.includes('Enter funding amount (SOL) for all wallets:') && stage === 0) {
          sendInput(stage0Inputs[currentStage0Input]);
          currentStage0Input++;
        } else if (buffer.includes('Choose an option (1-11):') && stage === 1) {
          if (currentStage1Input < stage1Inputs.length) {
            sendInput(stage1Inputs[currentStage1Input]);
            currentStage1Input++;
            
            if (currentStage1Input === stage1Inputs.length) {
              waitingForTimeout = true;
              setTimeout(() => {
                waitingForTimeout = false;
                sendInput('6');
                setTimeout(() => {
                  sendInput('6');
                }, 3000);
              }, 120000);
            }
          }
        } else if (buffer.includes('Enter Token Mint:') && stage === 1) {
          if (addresses.length > 0) {
            const address = addresses.shift();
            sendInput(address);
            fs.writeFileSync('kingofthehill.txt', addresses.join('\n'));
          } else {
            console.log('No more addresses available');
            botProcess.kill();
            process.exit();
          }
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