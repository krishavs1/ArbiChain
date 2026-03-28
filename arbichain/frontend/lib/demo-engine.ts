/**
 * Server-side demo engine — wraps lib/tron.js + lib/filecoin.js
 * All blockchain interactions happen here. Browser never sees private keys.
 */

import path from 'path';

const ROOT = path.resolve(process.cwd(), '..');

// Bypass webpack's static module resolution for runtime requires
const _require = eval('require') as NodeRequire;

function loadEnv() {
  _require('dotenv').config({ path: path.join(ROOT, '.env') });
}

function getTronLib() {
  loadEnv();
  return _require(path.join(ROOT, 'lib', 'tron.js'));
}

function getFilecoinLib() {
  loadEnv();
  return _require(path.join(ROOT, 'lib', 'filecoin.js'));
}

function getTypesLib() {
  return _require(path.join(ROOT, 'lib', 'types.js'));
}

const EXPLORER = 'https://nile.tronscan.org';

const ESCROW_ABI = [
  { inputs:[{name:'taskId',type:'bytes32'},{name:'seller',type:'address'},{name:'taskSpecCID',type:'string'},{name:'deliverByTimestamp',type:'uint256'},{name:'reviewWindowSeconds',type:'uint256'}], name:'createTask', stateMutability:'payable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'},{name:'deliverableCID',type:'string'}], name:'submitDeliverable', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'}], name:'approveDeliverable', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'},{name:'reason',type:'uint8'}], name:'openDisputeByBuyer', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'},{name:'reason',type:'uint8'}], name:'openDisputeBySeller', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'}], name:'escalateBuyerSilence', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'}], name:'cancelForMissedDelivery', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'},{name:'ruling',type:'uint8'}], name:'resolveDispute', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'}], name:'getTask', outputs:[{components:[
    {name:'buyer',type:'address'},{name:'seller',type:'address'},{name:'amount',type:'uint256'},
    {name:'taskSpecCID',type:'string'},{name:'deliverableCID',type:'string'},
    {name:'state',type:'uint8'},{name:'ruling',type:'uint8'},
    {name:'createdAt',type:'uint256'},{name:'deliveredAt',type:'uint256'},{name:'resolvedAt',type:'uint256'}
  ],name:'',type:'tuple'}], stateMutability:'view', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'}], name:'getTaskDeadlines', outputs:[{name:'deliverBy',type:'uint256'},{name:'reviewBy',type:'uint256'},{name:'reviewWindow',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'}], name:'getTaskDisputeMeta', outputs:[{name:'openedBy',type:'address'},{name:'reason',type:'uint8'}], stateMutability:'view', type:'function' },
  { inputs:[], name:'arbitrator', outputs:[{name:'',type:'address'}], stateMutability:'view', type:'function' },
];

const REPGATE_ABI = [
  { inputs:[{name:'buyer',type:'address'},{name:'seller',type:'address'},{name:'amount',type:'uint256'}], name:'recordTaskCompletion', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'buyer',type:'address'},{name:'seller',type:'address'}], name:'recordDisputeOpened', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'winner',type:'address'},{name:'loser',type:'address'}], name:'recordDisputeResolution', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'agent',type:'address'}], name:'getReputation', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[{name:'agent',type:'address'}], name:'getAgentStats', outputs:[{components:[
    {name:'reputation',type:'uint256'},{name:'tasksCompleted',type:'uint256'},
    {name:'tasksDisputed',type:'uint256'},{name:'disputesWon',type:'uint256'},
    {name:'disputesLost',type:'uint256'},{name:'totalVolumeAsBuyer',type:'uint256'},
    {name:'totalVolumeAsSeller',type:'uint256'},{name:'registeredAt',type:'uint256'},
    {name:'isRegistered',type:'bool'}
  ],name:'',type:'tuple'}], stateMutability:'view', type:'function' },
  { inputs:[{name:'buyer',type:'address'},{name:'seller',type:'address'},{name:'amount',type:'uint256'}], name:'getSuggestedTerms',
    outputs:[{name:'suggestedDeposit',type:'uint256'},{name:'requiresArbitration',type:'bool'}], stateMutability:'view', type:'function' },
];

// Lazy-initialized singletons
let _instances: any = null;

async function getInstances() {
  if (_instances) return _instances;

  const tronLib = getTronLib();
  loadEnv();

  const buyerTw = tronLib.createTronWeb(process.env.BUYER_PRIVATE_KEY, 'nile');
  const sellerTw = tronLib.createTronWeb(process.env.SELLER_PRIVATE_KEY, 'nile');
  const arbTw = tronLib.createTronWeb(process.env.ARBITRATOR_PRIVATE_KEY, 'nile');
  const ownerTw = tronLib.createTronWeb(process.env.TRON_PRIVATE_KEY, 'nile');

  const escrowBuyer = await buyerTw.contract(ESCROW_ABI, process.env.ESCROW_ADDRESS);
  const escrowSeller = await sellerTw.contract(ESCROW_ABI, process.env.ESCROW_ADDRESS);
  const escrowArb = await arbTw.contract(ESCROW_ABI, process.env.ESCROW_ADDRESS);
  const repGate = await ownerTw.contract(REPGATE_ABI, process.env.REPUTATION_GATE_ADDRESS);

  _instances = { buyerTw, sellerTw, arbTw, ownerTw, escrowBuyer, escrowSeller, escrowArb, repGate, tronLib };
  return _instances;
}

// In-memory state for current demo session
let currentHappyTaskId: string | null = null;
let currentDisputeTaskId: string | null = null;
let happySpecCid: string | null = null;
let happyDelivCid: string | null = null;
let disputeSpecCid: string | null = null;
let disputeDelivCid: string | null = null;

export async function getAgents() {
  const { buyerTw, sellerTw, arbTw, tronLib } = await getInstances();
  const { repGate } = await getInstances();

  const buyerAddr = buyerTw.defaultAddress.base58;
  const sellerAddr = sellerTw.defaultAddress.base58;
  const arbAddr = arbTw.defaultAddress.base58;

  const [buyerBal, sellerBal, arbBal] = await Promise.all([
    tronLib.getBalance(buyerTw, buyerAddr),
    tronLib.getBalance(sellerTw, sellerAddr),
    tronLib.getBalance(arbTw, arbAddr),
  ]);

  const [buyerStats, sellerStats, arbStats] = await Promise.all([
    repGate.getAgentStats(buyerAddr).call(),
    repGate.getAgentStats(sellerAddr).call(),
    repGate.getAgentStats(arbAddr).call(),
  ]);

  function formatStats(stats: any) {
    const rep = Number(stats.reputation);
    return {
      reputation: rep,
      tier: rep >= 700 ? 'Trusted' : rep >= 500 ? 'Established' : rep >= 300 ? 'New' : 'Untrusted',
      tasksCompleted: Number(stats.tasksCompleted),
      tasksDisputed: Number(stats.tasksDisputed),
      disputesWon: Number(stats.disputesWon),
      disputesLost: Number(stats.disputesLost),
      isRegistered: stats.isRegistered,
    };
  }

  return {
    buyer: { address: buyerAddr, balance: buyerBal, role: 'Buyer', ...formatStats(buyerStats) },
    seller: { address: sellerAddr, balance: sellerBal, role: 'Seller', ...formatStats(sellerStats) },
    arbitrator: { address: arbAddr, balance: arbBal, role: 'Arbitrator', ...formatStats(arbStats) },
    contracts: {
      escrow: process.env.ESCROW_ADDRESS,
      reputationGate: process.env.REPUTATION_GATE_ADDRESS,
    },
    network: 'TRON Nile',
    explorer: EXPLORER,
  };
}

export async function getFilecoinStatus() {
  const fil = getFilecoinLib();
  return await fil.getStatus();
}

export async function happyCreateTask() {
  const { buyerTw, sellerTw, escrowBuyer, tronLib } = await getInstances();
  const fil = getFilecoinLib();
  const types = getTypesLib();

  const taskId = types.generateTaskId();
  currentHappyTaskId = taskId;
  const sellerAddr = sellerTw.defaultAddress.base58;
  const buyerAddr = buyerTw.defaultAddress.base58;

  const taskSpec = {
    title: 'Write a blockchain explainer article',
    description: 'Create a 200+ word article explaining how blockchain consensus works',
    requirements: ['Minimum 200 words', 'Cover proof-of-work and proof-of-stake', 'Include real-world examples', 'Original content'],
    deliverableFormat: 'JSON with content field',
    maxPayment: '10 TRX',
  };

  const specUpload = await fil.uploadTaskSpec({ ...taskSpec, taskId, buyer: buyerAddr, seller: sellerAddr });
  happySpecCid = specUpload.cid;

  const amountSun = buyerTw.toSun(10);
  const deliverBy = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
  const reviewWindow = 10 * 60;
  const tx = await escrowBuyer.createTask(taskId, sellerAddr, specUpload.cid, deliverBy, reviewWindow).send({ callValue: amountSun, feeLimit: 100000000 });
  await tronLib.waitForConfirmation(buyerTw, tx);

  return {
    taskId,
    taskSpec,
    specCid: specUpload.cid,
    specProvider: specUpload.provider,
    specRetrievalUrl: specUpload.retrievalUrl,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    amount: '10 TRX',
    deliverBy,
    reviewWindowSeconds: reviewWindow,
  };
}

export async function happySubmitDeliverable() {
  if (!currentHappyTaskId || !happySpecCid) throw new Error('Run create-task first');

  const { sellerTw, escrowSeller, tronLib } = await getInstances();
  const fil = getFilecoinLib();
  const sellerAddr = sellerTw.defaultAddress.base58;

  const fetchedSpec = await fil.retrieveJson(happySpecCid);

  const deliverable = {
    taskId: currentHappyTaskId,
    content: {
      type: 'article',
      title: 'Understanding Blockchain Consensus Mechanisms',
      body: `Blockchain consensus mechanisms are the protocols that ensure all nodes in a decentralized network agree on the current state of the ledger. The two most prominent approaches are Proof of Work (PoW) and Proof of Stake (PoS).

Proof of Work, pioneered by Bitcoin in 2009, requires miners to solve computationally intensive puzzles. The first miner to find a valid hash gets to add the next block and receive a reward. While extremely secure, PoW consumes significant energy — Bitcoin alone uses more electricity than some countries.

Proof of Stake offers an energy-efficient alternative. Instead of computational power, validators lock up cryptocurrency as collateral. Ethereum's transition to PoS in 2022 ("The Merge") reduced its energy consumption by 99.95%. Validators are chosen based on their staked amount and other factors.

Real-world examples abound: supply chain tracking (Walmart uses blockchain to trace food origins), decentralized finance (Aave enables peer-to-peer lending without banks), and digital identity (Estonia's e-Residency program). These applications rely on consensus mechanisms to maintain trust without centralized authorities.

The evolution from PoW to PoS reflects the broader maturation of blockchain technology — balancing security, decentralization, and sustainability for practical adoption.`,
      wordCount: 178,
      requirements_met: ['200+ words', 'Covers PoW and PoS', 'Includes Walmart, Aave, Estonia examples', 'Original content'],
    },
    generatedAt: new Date().toISOString(),
    agentId: sellerAddr,
  };

  const delivUpload = await fil.uploadDeliverable(deliverable);
  happyDelivCid = delivUpload.cid;

  const tx = await escrowSeller.submitDeliverable(currentHappyTaskId, delivUpload.cid).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(sellerTw, tx);

  return {
    taskId: currentHappyTaskId,
    deliverableCid: delivUpload.cid,
    deliverableProvider: delivUpload.provider,
    deliverableRetrievalUrl: delivUpload.retrievalUrl,
    contentPreview: deliverable.content.title,
    wordCount: deliverable.content.wordCount,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
  };
}

export async function happyApprove() {
  if (!currentHappyTaskId) throw new Error('Run create-task first');

  const { buyerTw, escrowBuyer, tronLib } = await getInstances();

  const tx = await escrowBuyer.approveDeliverable(currentHappyTaskId).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(buyerTw, tx);

  return {
    taskId: currentHappyTaskId,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    action: 'Funds released to seller. Reputation was updated by Escrow on-chain.',
  };
}

export async function happyCancelForMissedDelivery() {
  if (!currentHappyTaskId) throw new Error('Run create-task first');
  const { buyerTw, escrowBuyer, tronLib } = await getInstances();
  const tx = await escrowBuyer.cancelForMissedDelivery(currentHappyTaskId).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(buyerTw, tx);
  return {
    taskId: currentHappyTaskId,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    action: 'Buyer cancelled task after missed seller delivery deadline.',
  };
}

export async function disputeCreateTask() {
  const { buyerTw, sellerTw, escrowBuyer, tronLib } = await getInstances();
  const fil = getFilecoinLib();
  const types = getTypesLib();

  const taskId = types.generateTaskId();
  currentDisputeTaskId = taskId;
  const sellerAddr = sellerTw.defaultAddress.base58;
  const buyerAddr = buyerTw.defaultAddress.base58;

  const taskSpec = {
    title: 'Academic research paper on zero-knowledge proofs',
    description: 'Write a 500+ word academic paper on ZK-proofs with citations',
    requirements: ['Minimum 500 words', 'Include academic citations (at least 3)', 'Cover ZK-SNARKs and ZK-STARKs', 'Formal academic tone'],
    deliverableFormat: 'JSON with content field',
    maxPayment: '10 TRX',
  };

  const specUpload = await fil.uploadTaskSpec({ ...taskSpec, taskId, buyer: buyerAddr, seller: sellerAddr });
  disputeSpecCid = specUpload.cid;

  const amountSun = buyerTw.toSun(10);
  const deliverBy = Math.floor(Date.now() / 1000) + (12 * 60 * 60);
  const reviewWindow = 60;
  const tx = await escrowBuyer.createTask(taskId, sellerAddr, specUpload.cid, deliverBy, reviewWindow).send({ callValue: amountSun, feeLimit: 100000000 });
  await tronLib.waitForConfirmation(buyerTw, tx);

  return {
    taskId,
    taskSpec,
    specCid: specUpload.cid,
    specProvider: specUpload.provider,
    specRetrievalUrl: specUpload.retrievalUrl,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    amount: '10 TRX',
    deliverBy,
    reviewWindowSeconds: reviewWindow,
  };
}

export async function disputeSubmitGarbage() {
  if (!currentDisputeTaskId) throw new Error('Run create-task first');

  const { sellerTw, escrowSeller, tronLib } = await getInstances();
  const fil = getFilecoinLib();
  const sellerAddr = sellerTw.defaultAddress.base58;

  const garbage = {
    taskId: currentDisputeTaskId,
    content: {
      type: 'article',
      title: 'ZK stuff',
      body: 'Zero knowledge proofs are cool. They let you prove things without showing the data. The end.',
    },
    generatedAt: new Date().toISOString(),
    agentId: sellerAddr,
  };

  const delivUpload = await fil.uploadDeliverable(garbage);
  disputeDelivCid = delivUpload.cid;

  const tx = await escrowSeller.submitDeliverable(currentDisputeTaskId, delivUpload.cid).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(sellerTw, tx);

  return {
    taskId: currentDisputeTaskId,
    deliverableCid: delivUpload.cid,
    deliverableRetrievalUrl: delivUpload.retrievalUrl,
    contentPreview: garbage.content.body,
    wordCount: garbage.content.body.split(/\s+/).length,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
  };
}

export async function disputeOpenDispute() {
  if (!currentDisputeTaskId) throw new Error('Run create-task first');

  const { buyerTw, escrowBuyer, tronLib } = await getInstances();

  const tx = await escrowBuyer.openDisputeByBuyer(currentDisputeTaskId, 1).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(buyerTw, tx);

  return {
    taskId: currentDisputeTaskId,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    reason: 'Deliverable does not meet requirements — 16 words vs 500 required',
    disputeOpenedBy: 'Buyer',
  };
}

export async function disputeSellerEscalateSilence() {
  if (!currentDisputeTaskId) throw new Error('Run create-task first');
  const { sellerTw, escrowSeller, tronLib } = await getInstances();
  const tx = await escrowSeller.escalateBuyerSilence(currentDisputeTaskId).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(sellerTw, tx);
  return {
    taskId: currentDisputeTaskId,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    reason: 'Buyer review window expired; seller escalated dispute.',
    disputeOpenedBy: 'Seller',
  };
}

export async function disputeResolve() {
  if (!currentDisputeTaskId || !disputeSpecCid || !disputeDelivCid) throw new Error('Run previous steps first');

  const { arbTw, escrowArb, tronLib } = await getInstances();
  const fil = getFilecoinLib();
  const arbAddr = arbTw.defaultAddress.base58;

  const arbDeliv = await fil.retrieveJson(disputeDelivCid);

  const wordCount = arbDeliv.content?.body?.split(/\s+/).length || 0;
  const hasCitations = /\[\d+\]|et al\.|doi:/i.test(arbDeliv.content?.body || '');
  const coversZkSnarks = /zk-snark/i.test(arbDeliv.content?.body || '');
  const coversZkStarks = /zk-stark/i.test(arbDeliv.content?.body || '');

  const analysis = {
    wordCount,
    requiredWords: 500,
    hasCitations,
    coversZkSnarks,
    coversZkStarks,
    requirementsMet: 0,
    requirementsTotal: 4,
    ruling: 'REFUND_BUYER',
  };

  const report = {
    type: 'arbitration_report',
    taskId: currentDisputeTaskId,
    ruling: 'REFUND_BUYER',
    analysis,
    evidence: { taskSpecCID: disputeSpecCid, deliverableCID: disputeDelivCid },
    arbitrator: arbAddr,
    resolvedAt: new Date().toISOString(),
  };

  const reportUpload = await fil.uploadEvidence(report);

  const tx = await escrowArb.resolveDispute(currentDisputeTaskId, 0).send({ feeLimit: 100000000 });
  await tronLib.waitForConfirmation(arbTw, tx);

  return {
    taskId: currentDisputeTaskId,
    analysis,
    reportCid: reportUpload.cid,
    reportRetrievalUrl: reportUpload.retrievalUrl,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    ruling: 'REFUND_BUYER',
    winner: 'Buyer',
  };
}

export async function getReputationTerms() {
  const { buyerTw, sellerTw, repGate } = await getInstances();
  const buyerAddr = buyerTw.defaultAddress.base58;
  const sellerAddr = sellerTw.defaultAddress.base58;

  const amount100TRX = buyerTw.toSun(100);
  const terms = await repGate.getSuggestedTerms(buyerAddr, sellerAddr, amount100TRX).call();

  return {
    taskAmount: '100 TRX',
    suggestedDeposit: buyerTw.fromSun(terms.suggestedDeposit.toString()),
    depositPercent: Math.round(Number(buyerTw.fromSun(terms.suggestedDeposit.toString())) / 100 * 100),
    requiresArbitration: terms.requiresArbitration,
  };
}

export async function getTaskState(taskId: string) {
  const { buyerTw, escrowBuyer } = await getInstances();
  const labels = ['Created', 'Funded', 'Delivered', 'Approved', 'Disputed', 'Resolved', 'Cancelled'];
  const reasons = ['None', 'QualityIssue', 'BuyerSilence', 'SellerAbuse', 'ScopeChange', 'Other'];
  const [t, deadlines, disputeMeta] = await Promise.all([
    escrowBuyer.getTask(taskId).call(),
    escrowBuyer.getTaskDeadlines(taskId).call(),
    escrowBuyer.getTaskDisputeMeta(taskId).call(),
  ]);
  return {
    buyer: buyerTw.address.fromHex(t.buyer),
    seller: buyerTw.address.fromHex(t.seller),
    amount: buyerTw.fromSun(t.amount.toString()),
    taskSpecCID: t.taskSpecCID,
    deliverableCID: t.deliverableCID,
    state: Number(t.state),
    stateLabel: labels[Number(t.state)] || 'Unknown',
    ruling: Number(t.ruling),
    deliverBy: Number(deadlines.deliverBy),
    reviewBy: Number(deadlines.reviewBy),
    reviewWindow: Number(deadlines.reviewWindow),
    disputeOpenedBy: disputeMeta.openedBy ? buyerTw.address.fromHex(disputeMeta.openedBy) : null,
    disputeReason: reasons[Number(disputeMeta.reason)] || 'Unknown',
  };
}
