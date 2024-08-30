const pty = require('node-pty');
const fs = require('fs');
const axios = require('axios');
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

const stages = [
  { name: 'fundWallets', inputs: ['2', '1', 'n', '0.3'] },
  { name: 'createLookupTable', inputs: ['3'] },
  { name: 'launch', inputs: ['5', '7', '', '5', '3'] },
  { name: 'sell', inputs: ['6', '1', '2', '4'] }
];

let currentStage = 0;
let currentInput = 0;
let tokenMint = '';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync('logs.txt', logMessage);
}

async function sendTelegramMessage(message) {
  try {
    const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: process.env.CHANNEL_ID,
      text: message
    });
    log('Telegram message sent successfully');
  } catch (error) {
    log(`Error sending Telegram message: ${error.message}`);
  }
}

async function getDevWalletBalance() {
  try {
    const connection = new Connection(process.env.HELIUS_RPC);
    const publicKey = new PublicKey(process.env.DEV_WALLET);
    const balance = await connection.getBalance(publicKey);
    return (balance / 1e9).toFixed(4); // Convert lamports to SOL and round to 4 decimal places
  } catch (error) {
    log(`Error fetching DEV_WALLET balance: ${error.message}`);
    return '0';
  }
}

function getMostRecentTokenMint() {
  try {
    const mintData = JSON.parse(fs.readFileSync('mint.json', 'utf8'));
    return mintData.mint || '';
  } catch (error) {
    log(`Error reading mint.json: ${error.message}`);
    return '';
  }
}

function startBot() {
  let transactionSuccessful = false;

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

      if (buffer.includes('Transaction successful')) {
        transactionSuccessful = true;
      }

      if (!inputSent) {
        if (buffer.includes('Choose an option:') || 
            buffer.includes('Enter buy amount (SOL) for all wallets:') || 
            buffer.includes('Do you wish to send unique amounts to each wallet? (y/n):') ||
            buffer.includes('Enter Token Mint:')) {
          if (currentInput < stages[currentStage].inputs.length) {
            let input = stages[currentStage].inputs[currentInput];
            if (stages[currentStage].name === 'launch' && buffer.includes('Enter Token Mint:')) {
              input = getTokenFromFile();
            }
            sendInput(input);
            currentInput++;
          } else if (stages[currentStage].name === 'fundWallets' || 
                     stages[currentStage].name === 'createLookupTable') {
            setTimeout(() => {
              botProcess.kill();
            }, 20000); // Changed to 20 seconds
          } else if (stages[currentStage].name === 'launch' && currentInput === stages[currentStage].inputs.length) {
            setTimeout(() => {
              botProcess.kill();
            }, 10000);
          } else if (stages[currentStage].name === 'sell') {
            setTimeout(() => {
              botProcess.kill();
            }, 10000);
          }
        }
      }
    });

    function sendInput(input) {
      inputSent = true;
      setTimeout(() => {
        setTimeout(() => {
          botProcess.write(input);
          setTimeout(() => {
            botProcess.write('\r');
            buffer = '';
            inputSent = false;
          }, 2000);
        }, 2000);
      }, 2000);
    }

    function getTokenFromFile() {
      try {
        const contracts = fs.readFileSync('contracts.txt', 'utf8').split('\n').filter(Boolean);
        if (contracts.length > 0) {
          const token = contracts.shift();
          fs.writeFileSync('contracts.txt', contracts.join('\n'));
          return token;
        }
      } catch (error) {
        return '';
      }
      return '';
    }

    botProcess.on('exit', async (exitCode) => {
      if (currentStage < stages.length - 1) {
        currentStage++;
        currentInput = 0;
        if (stages[currentStage].name === 'sell') {
          setTimeout(() => {
            runBot();
          }, 60000); // Wait 60 seconds before starting the sell stage
        } else {
          runBot();
        }
      } else {
        tokenMint = getMostRecentTokenMint();
        const devWalletBalance = await getDevWalletBalance();
        const message = `🚀 Launched: pump.fun/${tokenMint}\n\n😈 Dev Wallet Balance: ${devWalletBalance} SOL`;
        log('Waiting 10 seconds before sending Telegram message...');
        setTimeout(async () => {
          await sendTelegramMessage(message);
          log('Waiting 10 seconds before restarting the process...');
          setTimeout(() => {
            currentStage = 0;
            currentInput = 0;
            startBot();
          }, 10000);
        }, 10000);
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