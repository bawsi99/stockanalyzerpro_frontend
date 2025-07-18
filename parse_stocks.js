const fs = require('fs');
const readline = require('readline');

const input = fs.createReadStream('zerodha_instruments.csv');
const output = fs.createWriteStream('src/utils/stockList.json');

const rl = readline.createInterface({ input });

const seen = new Set();
const stocks = [];

rl.on('line', (line) => {
  if (line.startsWith('instrument_token')) return; // skip header
  const cols = line.split(',');
  if (cols.length < 12) return;
  const tradingsymbol = cols[2].trim();
  const name = cols[3].trim();
  const instrument_type = cols[9].trim();
  const exchange = cols[11].trim();

  if (
    tradingsymbol &&
    name &&
    (exchange === 'NSE' || exchange === 'BSE') &&
    instrument_type === 'EQ'
  ) {
    const key = `${tradingsymbol}_${exchange}`;
    if (!seen.has(key)) {
      seen.add(key);
      stocks.push({ symbol: tradingsymbol, name, exchange });
    }
  }
});

rl.on('close', () => {
  output.write(JSON.stringify(stocks, null, 2));
  output.end();
  console.log(`Wrote ${stocks.length} stocks to src/utils/stockList.json`);
}); 