// In-memory demo state (simulates blockchain state)
// This persists across API calls within a single server instance

interface TaskState {
  taskId: string
  status: "created" | "delivered" | "approved" | "disputed" | "resolved"
  specCid: string
  deliverableCid?: string
  reportCid?: string
}

interface DemoState {
  happyPath: TaskState | null
  disputePath: TaskState | null
}

const demoState: DemoState = {
  happyPath: null,
  disputePath: null,
}

// Mock addresses (deterministic for demo)
export const ADDRESSES = {
  buyer: "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL",
  seller: "TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW",
  arbitrator: "TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW6",
  escrowContract: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  reputationGate: "TPKDmyBk3Y6UVPFMK8DJF5gH2yUWRJqAp3",
}

export const EXPLORER_BASE = "https://nile.tronscan.org"

// Generate deterministic CIDs for demo
function generateCid(type: string, taskId: string): string {
  const base = "bafybeig"
  const hash = Buffer.from(`${type}-${taskId}`).toString("base64").slice(0, 44).toLowerCase().replace(/[^a-z0-9]/g, "a")
  return `${base}${hash}`
}

// Generate deterministic tx hash for demo
function generateTxHash(): string {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
}

export function getHappyPathState() {
  return demoState.happyPath
}

export function getDisputePathState() {
  return demoState.disputePath
}

export function resetHappyPath() {
  demoState.happyPath = null
}

export function resetDisputePath() {
  demoState.disputePath = null
}

// Happy path operations
export function createHappyTask() {
  const taskId = `task-${Date.now()}`
  const specCid = generateCid("spec", taskId)
  const txHash = generateTxHash()

  demoState.happyPath = {
    taskId,
    status: "created",
    specCid,
  }

  return {
    step: "create-task",
    taskId,
    taskSpec: {
      title: "Write a technical blog post",
      description: "Create a comprehensive blog post about zkSNARKs vs zkSTARKs",
      requirements: [
        "Minimum 1500 words",
        "Include citations from academic sources",
        "Cover both zkSNARKs and zkSTARKs",
        "Include a comparison table",
      ],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    specCid,
    specProvider: "synapse",
    specRetrievalUrl: `https://gateway.lighthouse.storage/ipfs/${specCid}`,
    txHash,
    explorerUrl: `${EXPLORER_BASE}/#/transaction/${txHash}`,
    amount: "10 TRX",
  }
}

export function submitHappyDeliverable() {
  if (!demoState.happyPath || demoState.happyPath.status !== "created") {
    throw new Error("Run create-task first")
  }

  const deliverableCid = generateCid("deliverable", demoState.happyPath.taskId)
  const txHash = generateTxHash()

  demoState.happyPath.deliverableCid = deliverableCid
  demoState.happyPath.status = "delivered"

  return {
    step: "submit-deliverable",
    taskId: demoState.happyPath.taskId,
    deliverableCid,
    deliverableProvider: "synapse",
    deliverableRetrievalUrl: `https://gateway.lighthouse.storage/ipfs/${deliverableCid}`,
    contentPreview: {
      title: "Understanding Zero-Knowledge Proofs: zkSNARKs vs zkSTARKs",
    },
    wordCount: 1847,
    txHash,
    explorerUrl: `${EXPLORER_BASE}/#/transaction/${txHash}`,
  }
}

export function approveHappyTask() {
  if (!demoState.happyPath || demoState.happyPath.status !== "delivered") {
    throw new Error("Run submit-deliverable first")
  }

  const txHash = generateTxHash()
  const repTxHash = generateTxHash()

  demoState.happyPath.status = "approved"

  return {
    step: "approve",
    taskId: demoState.happyPath.taskId,
    txHash,
    explorerUrl: `${EXPLORER_BASE}/#/transaction/${txHash}`,
    repTxHash,
    action: "Funds released to seller. Reputation updated for both parties.",
  }
}

// Dispute path operations
export function createDisputeTask() {
  const taskId = `task-${Date.now()}`
  const specCid = generateCid("spec-dispute", taskId)
  const txHash = generateTxHash()

  demoState.disputePath = {
    taskId,
    status: "created",
    specCid,
  }

  return {
    step: "create-task",
    taskId,
    taskSpec: {
      title: "Research Report on Layer 2 Scaling",
      description: "Comprehensive research report on Ethereum L2 scaling solutions",
      requirements: [
        "Minimum 2000 words",
        "Cover Optimistic Rollups and ZK Rollups",
        "Include performance benchmarks",
        "Peer-reviewed sources required",
      ],
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    specCid,
    specProvider: "synapse",
    specRetrievalUrl: `https://gateway.lighthouse.storage/ipfs/${specCid}`,
    txHash,
    explorerUrl: `${EXPLORER_BASE}/#/transaction/${txHash}`,
    amount: "25 TRX",
  }
}

export function submitGarbageDeliverable() {
  if (!demoState.disputePath || demoState.disputePath.status !== "created") {
    throw new Error("Run create-task first")
  }

  const deliverableCid = generateCid("garbage", demoState.disputePath.taskId)
  const txHash = generateTxHash()

  demoState.disputePath.deliverableCid = deliverableCid
  demoState.disputePath.status = "delivered"

  return {
    step: "submit-garbage",
    taskId: demoState.disputePath.taskId,
    deliverableCid,
    deliverableProvider: "synapse",
    deliverableRetrievalUrl: `https://gateway.lighthouse.storage/ipfs/${deliverableCid}`,
    contentPreview: {
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. This is placeholder text that doesn't meet requirements...",
    },
    wordCount: 127,
    txHash,
    explorerUrl: `${EXPLORER_BASE}/#/transaction/${txHash}`,
  }
}

export function openDispute() {
  if (!demoState.disputePath || demoState.disputePath.status !== "delivered") {
    throw new Error("Run submit-garbage first")
  }

  const txHash = generateTxHash()

  demoState.disputePath.status = "disputed"

  return {
    step: "open-dispute",
    taskId: demoState.disputePath.taskId,
    txHash,
    explorerUrl: `${EXPLORER_BASE}/#/transaction/${txHash}`,
    reason: "Deliverable does not meet specified requirements. Word count insufficient and topic not covered.",
  }
}

export function resolveDispute() {
  if (!demoState.disputePath || demoState.disputePath.status !== "disputed") {
    throw new Error("Run open-dispute first")
  }

  const reportCid = generateCid("report", demoState.disputePath.taskId)
  const txHash = generateTxHash()

  demoState.disputePath.reportCid = reportCid
  demoState.disputePath.status = "resolved"

  return {
    step: "resolve",
    taskId: demoState.disputePath.taskId,
    analysis: {
      wordCount: 127,
      requiredWords: 2000,
      hasCitations: false,
      coversZkSnarks: false,
      coversZkStarks: false,
      coversOptimisticRollups: false,
      coversZkRollups: false,
      requirementsMet: 0,
      requirementsTotal: 4,
      ruling: "REFUND_BUYER",
    },
    reportCid,
    reportRetrievalUrl: `https://gateway.lighthouse.storage/ipfs/${reportCid}`,
    txHash,
    explorerUrl: `${EXPLORER_BASE}/#/transaction/${txHash}`,
    ruling: "REFUND_BUYER",
    winner: "buyer",
  }
}

// Agent data with reputation
export function getAgentsData() {
  return {
    buyer: {
      address: ADDRESSES.buyer,
      balance: "1,234.56 TRX",
      role: "buyer",
      reputation: 85,
      tier: "Trusted",
      tasksCompleted: 12,
      tasksDisputed: 1,
      disputesWon: 1,
      disputesLost: 0,
      isRegistered: true,
    },
    seller: {
      address: ADDRESSES.seller,
      balance: "567.89 TRX",
      role: "seller",
      reputation: 72,
      tier: "Established",
      tasksCompleted: 8,
      tasksDisputed: 2,
      disputesWon: 1,
      disputesLost: 1,
      isRegistered: true,
    },
    arbitrator: {
      address: ADDRESSES.arbitrator,
      balance: "2,500.00 TRX",
      role: "arbitrator",
      reputation: 95,
      tier: "Trusted",
      tasksCompleted: 0,
      tasksDisputed: 15,
      disputesWon: 15,
      disputesLost: 0,
      isRegistered: true,
    },
    contracts: {
      escrow: ADDRESSES.escrowContract,
      reputationGate: ADDRESSES.reputationGate,
    },
    network: "TRON Nile",
    explorer: EXPLORER_BASE,
    filecoin: {
      provider: "synapse",
      configured: true,
      ready: true,
      balance: "0.5 FIL",
      network: "calibration",
      message: null,
    },
  }
}

// Reputation calculation
export function getReputationTerms() {
  return {
    taskAmount: "100 TRX",
    suggestedDeposit: "15 TRX",
    depositPercent: 15,
    requiresArbitration: false,
  }
}
