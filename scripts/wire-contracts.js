/**
 * Wire deployed contracts together (run after deploy-all.js)
 */
require('dotenv').config();
const TronWeb = require('tronweb');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function callAndWait(tw, contractAddr, fn, args) {
  console.log(`  ${fn}...`);
  const tx = await tw.transactionBuilder.triggerSmartContract(
    contractAddr, fn, { feeLimit: 50000000 }, args,
    tw.defaultAddress.hex
  );
  const signed = await tw.trx.sign(tx.transaction);
  const result = await tw.trx.sendRawTransaction(signed);
  if (!result.result) {
    console.error(`  FAILED:`, JSON.stringify(result));
    throw new Error(`${fn} failed: ${result.code}`);
  }
  console.log(`  TX: ${result.txid}`);
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    try {
      const info = await tw.trx.getTransactionInfo(result.txid);
      if (info && info.id) {
        console.log(`  Confirmed`);
        return info;
      }
    } catch {}
  }
  console.log('  Warning: confirmation timeout (tx may still be pending)');
}

(async () => {
  const tw = new TronWeb({ fullHost: 'https://nile.trongrid.io', privateKey: process.env.TRON_PRIVATE_KEY });

  const repGateAddr = process.env.REPUTATION_GATE_ADDRESS;
  const escrowAddr = process.env.ESCROW_ADDRESS;
  const arbiTokenAddr = process.env.ARBI_TOKEN_ADDRESS;
  const arbPoolAddr = process.env.ARBITRATOR_POOL_ADDRESS;

  console.log('Contract Addresses:');
  console.log('  ReputationGate:', repGateAddr);
  console.log('  Escrow:', escrowAddr);
  console.log('  ArbiToken:', arbiTokenAddr);
  console.log('  ArbitratorPool:', arbPoolAddr);
  console.log();

  const repGateHex = tw.address.toHex(repGateAddr);
  const escrowHex = tw.address.toHex(escrowAddr);
  const arbiTokenHex = tw.address.toHex(arbiTokenAddr);
  const arbPoolHex = tw.address.toHex(arbPoolAddr);

  // 1. Authorize Escrow on ReputationGate
  await callAndWait(tw, repGateHex, 'setAuthorizedUpdater(address,bool)',
    [{ type: 'address', value: escrowHex }, { type: 'bool', value: true }]);
  await sleep(5000);

  // 2. Authorize deployer on ReputationGate
  await callAndWait(tw, repGateHex, 'setAuthorizedUpdater(address,bool)',
    [{ type: 'address', value: tw.defaultAddress.hex }, { type: 'bool', value: true }]);
  await sleep(5000);

  // 3. ArbitratorPool → Escrow
  await callAndWait(tw, arbPoolHex, 'setEscrow(address)',
    [{ type: 'address', value: escrowHex }]);
  await sleep(5000);

  // 4. Escrow → ArbitratorPool
  await callAndWait(tw, escrowHex, 'setArbitratorPool(address)',
    [{ type: 'address', value: arbPoolHex }]);
  await sleep(5000);

  // 5. ArbitratorPool as ARBI minter
  await callAndWait(tw, arbiTokenHex, 'setMinter(address,bool)',
    [{ type: 'address', value: arbPoolHex }, { type: 'bool', value: true }]);

  console.log('\n✅ All contracts wired successfully!');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
