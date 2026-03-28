/**
 * Deploy only the Escrow contract and wire it to existing contracts
 */
require('dotenv').config();
const TronWeb = require('tronweb');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const tw = new TronWeb({ fullHost: 'https://nile.trongrid.io', privateKey: process.env.TRON_PRIVATE_KEY });
  const deployer = tw.defaultAddress.base58;
  const bal = await tw.trx.getBalance(deployer);
  console.log(`Deployer: ${deployer}, Balance: ${bal / 1e6} TRX\n`);

  const repGateAddr = process.env.REPUTATION_GATE_ADDRESS;
  const arbPoolAddr = process.env.ARBITRATOR_POOL_ADDRESS;
  console.log('ReputationGate:', repGateAddr);
  console.log('ArbitratorPool:', arbPoolAddr);

  // Load Escrow artifact
  const { abi, bytecode } = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'build', 'contracts', 'Escrow.json'), 'utf8')
  );

  console.log('\nDeploying Escrow...');
  const tx = await tw.transactionBuilder.createSmartContract({
    feeLimit: 2000000000,
    callValue: 0,
    userFeePercentage: 100,
    originEnergyLimit: 10000000,
    abi,
    bytecode,
    parameters: [tw.defaultAddress.hex, tw.address.toHex(repGateAddr)],
  }, tw.defaultAddress.hex);

  const signed = await tw.trx.sign(tx);
  const result = await tw.trx.sendRawTransaction(signed);
  if (!result.result) {
    console.error('Deploy failed:', JSON.stringify(result));
    process.exit(1);
  }
  console.log('TX:', result.txid);

  // Wait for confirmation
  let contractAddr;
  for (let i = 0; i < 30; i++) {
    await sleep(3000);
    try {
      const info = await tw.trx.getTransactionInfo(result.txid);
      if (info && info.id) {
        // Verify contract actually exists
        if (info.receipt && info.receipt.result === 'SUCCESS') {
          contractAddr = info.contract_address;
          break;
        } else if (info.receipt) {
          console.error('Contract deployment failed on-chain:', info.receipt.result);
          console.error('Energy used:', info.receipt.energy_usage_total);
          process.exit(1);
        }
      }
    } catch {}
  }

  if (!contractAddr) {
    console.error('Deployment not confirmed in 90s');
    process.exit(1);
  }

  const base58 = tw.address.fromHex(contractAddr);
  console.log('Escrow deployed:', base58, '(' + contractAddr + ')');

  // Verify
  const c = await tw.trx.getContract(base58);
  if (!c.bytecode) {
    console.error('Contract not found at address!');
    process.exit(1);
  }
  console.log('Verified: contract exists on-chain');

  // Wire: Escrow authorized on RepGate
  console.log('\nWiring...');
  await sleep(5000);

  async function callFn(addr, fn, args) {
    console.log('  ' + fn);
    const tx = await tw.transactionBuilder.triggerSmartContract(
      addr, fn, { feeLimit: 50000000 }, args, tw.defaultAddress.hex
    );
    const s = await tw.trx.sign(tx.transaction);
    const r = await tw.trx.sendRawTransaction(s);
    if (!r.result) { console.error('    FAILED:', JSON.stringify(r)); return; }
    console.log('    TX:', r.txid);
    for (let i = 0; i < 20; i++) {
      await sleep(3000);
      try { const info = await tw.trx.getTransactionInfo(r.txid); if (info && info.id) { console.log('    OK'); return; } } catch {}
    }
    console.log('    Timeout (may still be pending)');
  }

  // 1. Authorize Escrow on ReputationGate
  await callFn(tw.address.toHex(repGateAddr), 'setAuthorizedUpdater(address,bool)',
    [{ type: 'address', value: contractAddr }, { type: 'bool', value: true }]);
  await sleep(8000);

  // 2. ArbitratorPool → Escrow
  await callFn(tw.address.toHex(arbPoolAddr), 'setEscrow(address)',
    [{ type: 'address', value: contractAddr }]);
  await sleep(8000);

  // 3. Escrow → ArbitratorPool
  await callFn(contractAddr, 'setArbitratorPool(address)',
    [{ type: 'address', value: tw.address.toHex(arbPoolAddr) }]);

  console.log('\n✅ Done! Update .env:');
  console.log(`ESCROW_ADDRESS=${base58}`);
})().catch(e => { console.error('FATAL:', e.message || e); process.exit(1); });
