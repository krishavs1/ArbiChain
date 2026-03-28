/**
 * Server-side demo engine — wraps lib/tron.js + lib/filecoin.js
 * All blockchain interactions happen here. Browser never sees private keys.
 */

import path from 'path';
import fs from 'fs';

// When running locally via `cd frontend && next dev`, cwd is frontend/ so ROOT = ..
// On Railway, cwd is the repo root itself, so ROOT = cwd
const _cwd = process.cwd();
const ROOT = fs.existsSync(path.join(_cwd, 'lib', 'tron.js')) ? _cwd : path.resolve(_cwd, '..');

// Bypass webpack's static module resolution for runtime requires
const _require = eval('require') as NodeRequire;

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    _require('dotenv').config({ path: envPath });
  }
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

function getAiLib() {
  loadEnv();
  return _require(path.join(ROOT, 'lib', 'ai.js'));
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

const ARBI_TOKEN_ABI = [
  { inputs:[{name:'account',type:'address'}], name:'balanceOf', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[{name:'to',type:'address'},{name:'value',type:'uint256'}], name:'transfer', outputs:[{name:'',type:'bool'}], stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'spender',type:'address'},{name:'value',type:'uint256'}], name:'approve', outputs:[{name:'',type:'bool'}], stateMutability:'nonpayable', type:'function' },
  { inputs:[], name:'totalSupply', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[], name:'symbol', outputs:[{name:'',type:'string'}], stateMutability:'view', type:'function' },
  { inputs:[], name:'decimals', outputs:[{name:'',type:'uint8'}], stateMutability:'view', type:'function' },
];

const ARB_POOL_ABI = [
  { inputs:[{name:'amount',type:'uint256'}], name:'joinPool', stateMutability:'nonpayable', type:'function' },
  { inputs:[], name:'leavePool', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'arb',type:'address'},{name:'stakeAmount',type:'uint256'}], name:'addArbitrator', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'},{name:'ruling',type:'uint8'}], name:'castVote', stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'taskId',type:'bytes32'}], name:'getPanel', outputs:[
    {name:'members',type:'address[3]'},{name:'votes',type:'uint8[3]'},
    {name:'voteCount',type:'uint256'},{name:'resolved',type:'bool'},{name:'outcome',type:'uint8'}
  ], stateMutability:'view', type:'function' },
  { inputs:[{name:'arb',type:'address'}], name:'getArbitrator', outputs:[
    {name:'isActive',type:'bool'},{name:'stakedAmount',type:'uint256'},
    {name:'totalVotes',type:'uint256'},{name:'correctVotes',type:'uint256'},
    {name:'earnedRewards',type:'uint256'}
  ], stateMutability:'view', type:'function' },
  { inputs:[], name:'poolSize', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[], name:'totalDisputes', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[], name:'PANEL_SIZE', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[], name:'VOTE_THRESHOLD', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[], name:'REWARD_PER_CORRECT_VOTE', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[], name:'SLASH_PER_WRONG_VOTE', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
  { inputs:[], name:'minStake', outputs:[{name:'',type:'uint256'}], stateMutability:'view', type:'function' },
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

  // ArbiToken + ArbitratorPool
  const arbiToken = process.env.ARBI_TOKEN_ADDRESS
    ? await ownerTw.contract(ARBI_TOKEN_ABI, process.env.ARBI_TOKEN_ADDRESS)
    : null;
  const arbPool = process.env.ARBITRATOR_POOL_ADDRESS
    ? await ownerTw.contract(ARB_POOL_ABI, process.env.ARBITRATOR_POOL_ADDRESS)
    : null;

  // Pool contract instances for each arbitrator to cast votes
  const arbPoolArb = process.env.ARBITRATOR_POOL_ADDRESS
    ? await arbTw.contract(ARB_POOL_ABI, process.env.ARBITRATOR_POOL_ADDRESS)
    : null;
  const arbPoolOwner = process.env.ARBITRATOR_POOL_ADDRESS
    ? await ownerTw.contract(ARB_POOL_ABI, process.env.ARBITRATOR_POOL_ADDRESS)
    : null;
  const arbPoolBuyer = process.env.ARBITRATOR_POOL_ADDRESS
    ? await buyerTw.contract(ARB_POOL_ABI, process.env.ARBITRATOR_POOL_ADDRESS)
    : null;

  _instances = {
    buyerTw, sellerTw, arbTw, ownerTw,
    escrowBuyer, escrowSeller, escrowArb, repGate,
    arbiToken, arbPool, arbPoolArb, arbPoolOwner, arbPoolBuyer,
    tronLib,
  };
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

  // ARBI token balances (if available)
  const { arbiToken } = await getInstances();
  let arbiBalances = { buyer: 0, seller: 0, arbitrator: 0 };
  if (arbiToken) {
    const [bBal, sBal, aBal] = await Promise.all([
      arbiToken.balanceOf(buyerAddr).call(),
      arbiToken.balanceOf(sellerAddr).call(),
      arbiToken.balanceOf(arbAddr).call(),
    ]);
    arbiBalances = {
      buyer: Number(bBal) / 1e18,
      seller: Number(sBal) / 1e18,
      arbitrator: Number(aBal) / 1e18,
    };
  }

  return {
    buyer: { address: buyerAddr, balance: buyerBal, role: 'Buyer', arbiBalance: arbiBalances.buyer, ...formatStats(buyerStats) },
    seller: { address: sellerAddr, balance: sellerBal, role: 'Seller', arbiBalance: arbiBalances.seller, ...formatStats(sellerStats) },
    arbitrator: { address: arbAddr, balance: arbBal, role: 'Arbitrator', arbiBalance: arbiBalances.arbitrator, ...formatStats(arbStats) },
    contracts: {
      escrow: process.env.ESCROW_ADDRESS,
      reputationGate: process.env.REPUTATION_GATE_ADDRESS,
      arbiToken: process.env.ARBI_TOKEN_ADDRESS,
      arbitratorPool: process.env.ARBITRATOR_POOL_ADDRESS,
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
  const ai = getAiLib();
  const sellerAddr = sellerTw.defaultAddress.base58;

  const fetchedSpec = await fil.retrieveJson(happySpecCid);

  // AI Seller Agent generates real content from the task spec
  const generated = await ai.sellerGenerate(fetchedSpec, { lowEffort: false });

  const deliverable = {
    taskId: currentHappyTaskId,
    content: {
      type: 'article',
      title: generated.title,
      body: generated.body,
      wordCount: generated.wordCount,
    },
    aiMetadata: {
      model: generated.model,
      tokensUsed: generated.tokensUsed,
      agent: 'seller',
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
    contentPreview: generated.title,
    contentBody: generated.body,
    wordCount: generated.wordCount,
    aiModel: generated.model,
    aiTokensUsed: generated.tokensUsed,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
  };
}

export async function happyApprove() {
  if (!currentHappyTaskId || !happySpecCid || !happyDelivCid) throw new Error('Run create-task and submit-deliverable first');

  const { buyerTw, escrowBuyer, tronLib } = await getInstances();
  const fil = getFilecoinLib();
  const ai = getAiLib();

  // AI Buyer Agent reviews the deliverable against the task spec
  const spec = await fil.retrieveJson(happySpecCid);
  const deliv = await fil.retrieveJson(happyDelivCid);

  const review = await ai.buyerReview(spec, deliv.content || deliv);

  // Approve on-chain (in the happy path, we always approve regardless of AI verdict)
  const tx = await escrowBuyer.approveDeliverable(currentHappyTaskId).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(buyerTw, tx);

  return {
    taskId: currentHappyTaskId,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    action: 'Funds released to seller. Reputation updated on-chain.',
    reputationUpdate: [
      { agent: 'Buyer', change: '+10', reason: 'Task completed successfully' },
      { agent: 'Seller', change: '+20', reason: 'Deliverable approved by buyer' },
    ],
    aiReview: {
      approved: review.approved,
      overallScore: review.overallScore,
      rubric: review.rubric,
      reasoning: review.reasoning,
      model: review.model,
      tokensUsed: review.tokensUsed,
    },
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
  const reviewWindow = 30 * 60; // 30 min — enough for AI agent processing + Filecoin uploads
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
  if (!currentDisputeTaskId || !disputeSpecCid) throw new Error('Run create-task first');

  const { sellerTw, escrowSeller, tronLib } = await getInstances();
  const fil = getFilecoinLib();
  const ai = getAiLib();
  const sellerAddr = sellerTw.defaultAddress.base58;

  const spec = await fil.retrieveJson(disputeSpecCid);

  // AI Seller Agent in low-effort mode — intentionally produces garbage
  const generated = await ai.sellerGenerate(spec, { lowEffort: true });

  const garbage = {
    taskId: currentDisputeTaskId,
    content: {
      type: 'article',
      title: generated.title,
      body: generated.body,
      wordCount: generated.wordCount,
    },
    aiMetadata: {
      model: generated.model,
      tokensUsed: generated.tokensUsed,
      agent: 'seller (low-effort)',
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
    contentPreview: generated.body,
    wordCount: generated.wordCount,
    aiModel: generated.model,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
  };
}

export async function disputeOpenDispute() {
  if (!currentDisputeTaskId || !disputeSpecCid || !disputeDelivCid) throw new Error('Run previous steps first');

  const { buyerTw, escrowBuyer, tronLib } = await getInstances();
  const fil = getFilecoinLib();
  const ai = getAiLib();

  // AI Buyer Agent reviews and rejects, triggering dispute
  const spec = await fil.retrieveJson(disputeSpecCid);
  const deliv = await fil.retrieveJson(disputeDelivCid);
  const review = await ai.buyerReview(spec, deliv.content || deliv);

  const tx = await escrowBuyer.openDisputeByBuyer(currentDisputeTaskId, 1).send({ feeLimit: 300000000 });
  await tronLib.waitForConfirmation(buyerTw, tx);

  return {
    taskId: currentDisputeTaskId,
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    disputeOpenedBy: 'Buyer (AI Agent)',
    reputationUpdate: [
      { agent: 'Seller', change: '-10', reason: 'Dispute opened against deliverable' },
    ],
    aiReview: {
      approved: review.approved,
      overallScore: review.overallScore,
      rubric: review.rubric,
      reasoning: review.reasoning,
      model: review.model,
    },
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

export async function disputeAnalyzeEvidence() {
  if (!currentDisputeTaskId || !disputeSpecCid || !disputeDelivCid) throw new Error('Run previous steps first');

  const { arbTw } = await getInstances();
  const fil = getFilecoinLib();
  const ai = getAiLib();
  const arbAddr = arbTw.defaultAddress.base58;

  const spec = await fil.retrieveJson(disputeSpecCid);
  const deliv = await fil.retrieveJson(disputeDelivCid);

  // AI Arbitrator Agent performs deep analysis
  const aiAnalysis = await ai.arbitratorAnalyze(
    spec,
    deliv.content || deliv,
    { disputeReason: 'Quality issue', disputeOpenedBy: 'Buyer' },
  );

  const report = {
    type: 'arbitration_report',
    taskId: currentDisputeTaskId,
    ruling: aiAnalysis.ruling,
    confidence: aiAnalysis.confidence,
    requirementAnalysis: aiAnalysis.requirementAnalysis,
    requirementsMet: aiAnalysis.requirementsMet,
    requirementsTotal: aiAnalysis.requirementsTotal,
    rationale: aiAnalysis.rationale,
    mitigatingFactors: aiAnalysis.mitigatingFactors,
    evidence: { taskSpecCID: disputeSpecCid, deliverableCID: disputeDelivCid },
    aiMetadata: { model: aiAnalysis.model, tokensUsed: aiAnalysis.tokensUsed },
    arbitrator: arbAddr,
    resolvedAt: new Date().toISOString(),
  };

  const reportUpload = await fil.uploadEvidence(report);

  return {
    taskId: currentDisputeTaskId,
    aiAnalysis: {
      ruling: aiAnalysis.ruling,
      confidence: aiAnalysis.confidence,
      requirementAnalysis: aiAnalysis.requirementAnalysis,
      requirementsMet: aiAnalysis.requirementsMet,
      requirementsTotal: aiAnalysis.requirementsTotal,
      rationale: aiAnalysis.rationale,
      mitigatingFactors: aiAnalysis.mitigatingFactors,
      model: aiAnalysis.model,
    },
    reportCid: reportUpload.cid,
    reportRetrievalUrl: reportUpload.retrievalUrl,
  };
}

export async function disputePanelVote(voterIndex: number) {
  if (!currentDisputeTaskId) throw new Error('Run previous steps first');
  return castPanelVote(currentDisputeTaskId, voterIndex, 1); // 1 = refund buyer
}

export async function disputeResolve() {
  if (!currentDisputeTaskId || !disputeSpecCid || !disputeDelivCid) throw new Error('Run previous steps first');

  const { arbPool, arbTw, escrowArb, tronLib } = await getInstances();
  const fil = getFilecoinLib();
  const ai = getAiLib();
  const arbAddr = arbTw.defaultAddress.base58;

  const spec = await fil.retrieveJson(disputeSpecCid);
  const deliv = await fil.retrieveJson(disputeDelivCid);

  const aiAnalysis = await ai.arbitratorAnalyze(
    spec,
    deliv.content || deliv,
    { disputeReason: 'Quality issue', disputeOpenedBy: 'Buyer' },
  );

  const report = {
    type: 'arbitration_report',
    taskId: currentDisputeTaskId,
    ruling: aiAnalysis.ruling,
    confidence: aiAnalysis.confidence,
    rationale: aiAnalysis.rationale,
    requirementAnalysis: aiAnalysis.requirementAnalysis,
    evidence: { taskSpecCID: disputeSpecCid, deliverableCID: disputeDelivCid },
    aiMetadata: { model: aiAnalysis.model, tokensUsed: aiAnalysis.tokensUsed },
    arbitrator: arbAddr,
    resolvedAt: new Date().toISOString(),
  };

  const reportUpload = await fil.uploadEvidence(report);

  if (!arbPool) {
    const escrowRuling = aiAnalysis.ruling === 'REFUND_BUYER' ? 0 : 1;
    const tx = await escrowArb.resolveDispute(currentDisputeTaskId, escrowRuling).send({ feeLimit: 100000000 });
    await tronLib.waitForConfirmation(arbTw, tx);

    return {
      taskId: currentDisputeTaskId,
      aiAnalysis: {
        ruling: aiAnalysis.ruling,
        confidence: aiAnalysis.confidence,
        rationale: aiAnalysis.rationale,
        requirementsMet: aiAnalysis.requirementsMet,
        requirementsTotal: aiAnalysis.requirementsTotal,
        model: aiAnalysis.model,
      },
      reportCid: reportUpload.cid,
      reportRetrievalUrl: reportUpload.retrievalUrl,
      txHash: tx,
      explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
      winner: aiAnalysis.ruling === 'REFUND_BUYER' ? 'Buyer' : 'Seller',
      mode: 'single-arbitrator',
    };
  }

  return {
    taskId: currentDisputeTaskId,
    aiAnalysis: {
      ruling: aiAnalysis.ruling,
      confidence: aiAnalysis.confidence,
      rationale: aiAnalysis.rationale,
      requirementsMet: aiAnalysis.requirementsMet,
      requirementsTotal: aiAnalysis.requirementsTotal,
      model: aiAnalysis.model,
    },
    reportCid: reportUpload.cid,
    reportRetrievalUrl: reportUpload.retrievalUrl,
    winner: aiAnalysis.ruling === 'REFUND_BUYER' ? 'Buyer' : 'Seller',
    mode: 'panel-voting',
    message: 'AI analysis complete. Panel votes will finalize the dispute on-chain.',
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

// ============ ArbitratorPool + Token Functions ============

export async function getPoolStatus() {
  const { arbPool, arbiToken, ownerTw, arbTw, buyerTw } = await getInstances();
  if (!arbPool || !arbiToken) return { enabled: false };

  const ownerAddr = ownerTw.defaultAddress.base58;
  const arbAddr = arbTw.defaultAddress.base58;
  const buyerAddr = buyerTw.defaultAddress.base58;

  const [poolSize, totalDisputes] = await Promise.all([
    arbPool.poolSize().call(),
    arbPool.totalDisputes().call(),
  ]);

  const panelAddrs = [ownerAddr, arbAddr, buyerAddr];
  const arbInfos = await Promise.all(
    panelAddrs.map(async (addr: string) => {
      const info = await arbPool.getArbitrator(addr).call();
      const tokenBal = await arbiToken.balanceOf(addr).call();
      return {
        address: addr,
        isActive: info.isActive,
        stakedAmount: Number(info.stakedAmount) / 1e18,
        totalVotes: Number(info.totalVotes),
        correctVotes: Number(info.correctVotes),
        earnedRewards: Number(info.earnedRewards) / 1e18,
        tokenBalance: Number(tokenBal) / 1e18,
      };
    })
  );

  const totalSupply = await arbiToken.totalSupply().call();

  return {
    enabled: true,
    poolSize: Number(poolSize),
    totalDisputes: Number(totalDisputes),
    totalTokenSupply: Number(totalSupply) / 1e18,
    arbitrators: arbInfos,
    panelSize: 3,
    voteThreshold: 2,
  };
}

export async function setupPool() {
  const { arbPool, arbiToken, ownerTw, arbTw, buyerTw, tronLib } = await getInstances();
  if (!arbPool || !arbiToken) throw new Error('Pool contracts not configured');

  const ownerAddr = ownerTw.defaultAddress.base58;
  const arbAddr = arbTw.defaultAddress.base58;
  const buyerAddr = buyerTw.defaultAddress.base58;
  const stakeAmount = '100000000000000000000'; // 100 ARBI

  const results: any[] = [];

  // Transfer ARBI tokens to arb and buyer so they can be registered
  const tx1 = await arbiToken.transfer(arbAddr, stakeAmount).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(ownerTw, tx1);
  results.push({ action: `Transferred 100 ARBI to arbitrator`, txHash: tx1 });

  const tx2 = await arbiToken.transfer(buyerAddr, stakeAmount).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(ownerTw, tx2);
  results.push({ action: `Transferred 100 ARBI to buyer (panel member)`, txHash: tx2 });

  // Owner registers all 3 using addArbitrator (bypasses staking for demo speed)
  const tx3 = await arbPool.addArbitrator(ownerAddr, stakeAmount).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(ownerTw, tx3);
  results.push({ action: `Registered deployer in pool`, txHash: tx3 });

  const tx4 = await arbPool.addArbitrator(arbAddr, stakeAmount).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(ownerTw, tx4);
  results.push({ action: `Registered arbitrator in pool`, txHash: tx4 });

  const tx5 = await arbPool.addArbitrator(buyerAddr, stakeAmount).send({ feeLimit: 50000000 });
  await tronLib.waitForConfirmation(ownerTw, tx5);
  results.push({ action: `Registered buyer as panel member`, txHash: tx5 });

  return {
    poolSize: 3,
    arbitrators: [ownerAddr, arbAddr, buyerAddr],
    results,
  };
}

export async function getDisputePanel(taskId: string) {
  const { arbPool, buyerTw } = await getInstances();
  if (!arbPool) throw new Error('Pool not configured');

  const panel = await arbPool.getPanel(taskId).call();
  const voteLabels = ['Not Voted', 'Refund Buyer', 'Pay Seller'];

  return {
    members: panel.members.map((m: string) => buyerTw.address.fromHex(m)),
    votes: panel.votes.map((v: any) => ({
      value: Number(v),
      label: voteLabels[Number(v)] || 'Unknown',
    })),
    voteCount: Number(panel.voteCount),
    resolved: panel.resolved,
    outcome: Number(panel.outcome),
    outcomeLabel: panel.resolved ? voteLabels[Number(panel.outcome)] : 'Pending',
  };
}

export async function castPanelVote(taskId: string, voterIndex: number, ruling: number) {
  const { arbPoolOwner, arbPoolArb, arbPoolBuyer, ownerTw, arbTw, buyerTw, tronLib } = await getInstances();

  const pools = [arbPoolOwner, arbPoolArb, arbPoolBuyer];
  const tws = [ownerTw, arbTw, buyerTw];
  const labels = ['Deployer', 'Arbitrator', 'Panel Member 3'];

  if (voterIndex < 0 || voterIndex > 2) throw new Error('Invalid voter index');
  const pool = pools[voterIndex];
  const tw = tws[voterIndex];
  if (!pool) throw new Error('Pool not configured');

  const tx = await pool.castVote(taskId, ruling).send({ feeLimit: 500000000 });
  await tronLib.waitForConfirmation(tw, tx);

  const panel = await pools[0].getPanel(taskId).call();

  const result: any = {
    voter: labels[voterIndex],
    voterAddress: tw.defaultAddress.base58,
    ruling,
    rulingLabel: ruling === 1 ? 'Refund Buyer' : 'Pay Seller',
    txHash: tx,
    explorerUrl: `${EXPLORER}/#/transaction/${tx}`,
    panelResolved: panel.resolved,
    panelOutcome: Number(panel.outcome),
  };

  if (panel.resolved) {
    const isRefund = Number(panel.outcome) === 1;
    result.reputationUpdate = isRefund
      ? [
          { agent: 'Buyer (winner)', change: '+5', reason: 'Won dispute — refund granted' },
          { agent: 'Seller (loser)', change: '-50', reason: 'Lost dispute — deliverable rejected' },
        ]
      : [
          { agent: 'Seller (winner)', change: '+5', reason: 'Won dispute — payment released' },
          { agent: 'Buyer (loser)', change: '-50', reason: 'Lost dispute — claim rejected' },
        ];
    result.tokenRewards = [
      { agent: 'Correct voters', change: '+10 ARBI each', reason: 'Voted with majority' },
      { agent: 'Minority voter', change: '-5 ARBI stake slashed', reason: 'Voted against majority' },
    ];
  }

  return result;
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
