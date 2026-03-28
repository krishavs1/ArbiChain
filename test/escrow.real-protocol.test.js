const Escrow = artifacts.require("Escrow");
const ReputationGate = artifacts.require("ReputationGate");

contract("Escrow real protocol rules", (accounts) => {
  const owner = accounts[0];
  const buyer = accounts[1];
  const seller = accounts[2];
  const arbitrator = accounts[3];

  let escrow;
  let rep;

  const toNum = (v) => (v && typeof v.toNumber === "function" ? v.toNumber() : Number(v));
  const toSun = (trx) => trx * 1_000_000;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const taskId = (seed) => `0x${seed.toString(16).padStart(64, "0")}`;

  beforeEach(async () => {
    rep = await ReputationGate.new({ from: owner });
    escrow = await Escrow.new(arbitrator, rep.address, { from: owner });
    await rep.setAuthorizedUpdater(escrow.address, true, { from: owner });
  });

  it("creates tasks with enforced timing metadata", async () => {
    const now = Math.floor(Date.now() / 1000);
    const deliverBy = now + 300;
    const reviewWindow = 120;
    await escrow.createTask(
      taskId(1),
      seller,
      "baga6ea4seaqspec",
      deliverBy,
      reviewWindow,
      { from: buyer, callValue: toSun(10) }
    );

    const deadlines = await escrow.getTaskDeadlines(taskId(1));
    assert.equal(toNum(deadlines.deliverBy), deliverBy, "deliverBy mismatch");
    assert.equal(toNum(deadlines.reviewWindow), reviewWindow, "reviewWindow mismatch");
  });

  it("lets buyer cancel after seller misses delivery deadline", async () => {
    const now = Math.floor(Date.now() / 1000);
    await escrow.createTask(taskId(2), seller, "baga6ea4seaqspec", now + 1, 120, {
      from: buyer,
      callValue: toSun(5),
    });
    await sleep(2000);

    await escrow.cancelForMissedDelivery(taskId(2), { from: buyer });
    const task = await escrow.getTask(taskId(2));
    assert.equal(toNum(task.state), 6, "expected Cancelled state");
    assert.equal(toNum(task.ruling), 1, "expected RefundBuyer ruling");
  });

  it("allows seller-initiated disputes in delivered state", async () => {
    const now = Math.floor(Date.now() / 1000);
    await escrow.createTask(taskId(3), seller, "baga6ea4seaqspec", now + 300, 120, {
      from: buyer,
      callValue: toSun(5),
    });
    await escrow.submitDeliverable(taskId(3), "baga6ea4seaqdeliverable", { from: seller });
    await escrow.openDisputeBySeller(taskId(3), 3, { from: seller }); // SellerAbuse

    const task = await escrow.getTask(taskId(3));
    const meta = await escrow.getTaskDisputeMeta(taskId(3));
    assert.equal(toNum(task.state), 4, "expected Disputed state");
    assert.equal(meta.openedBy, seller, "expected seller to open dispute");
    assert.equal(toNum(meta.reason), 3, "expected SellerAbuse reason");
  });

  it("updates reputation via escrow on successful approval", async () => {
    const now = Math.floor(Date.now() / 1000);
    await rep.registerAgentFor(buyer, { from: owner });
    await rep.registerAgentFor(seller, { from: owner });

    const buyerBefore = await rep.getReputation(buyer);
    const sellerBefore = await rep.getReputation(seller);

    await escrow.createTask(taskId(4), seller, "baga6ea4seaqspec", now + 300, 120, {
      from: buyer,
      callValue: toSun(10),
    });
    await escrow.submitDeliverable(taskId(4), "baga6ea4seaqdeliverable", { from: seller });
    await escrow.approveDeliverable(taskId(4), { from: buyer });

    const buyerAfter = await rep.getReputation(buyer);
    const sellerAfter = await rep.getReputation(seller);

    assert.isAbove(toNum(buyerAfter), toNum(buyerBefore), "buyer reputation should increase");
    assert.isAbove(toNum(sellerAfter), toNum(sellerBefore), "seller reputation should increase");
  });
});
