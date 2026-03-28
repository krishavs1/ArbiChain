// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEscrow {
    function resolveDispute(bytes32 taskId, uint8 ruling) external;
}

interface IArbiToken {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

/**
 * @title ArbitratorPool
 * @notice Decentralized multi-sig dispute resolution with rotating arbitrator panels
 * @dev Arbitrators stake ARBI tokens to join the pool. For each dispute a panel of
 *      PANEL_SIZE arbitrators is selected (round-robin). 2-of-3 majority resolves.
 *      Correct voters earn ARBI rewards; minority voters get slashed.
 */
contract ArbitratorPool {

    // ============ Constants ============

    uint256 public constant PANEL_SIZE = 3;
    uint256 public constant VOTE_THRESHOLD = 2;
    uint256 public constant REWARD_PER_CORRECT_VOTE = 10 * 1e18;
    uint256 public constant SLASH_PER_WRONG_VOTE    =  5 * 1e18;

    // ============ Structs ============

    struct Arbitrator {
        bool   isActive;
        uint256 stakedAmount;
        uint256 totalVotes;
        uint256 correctVotes;
        uint256 earnedRewards;
    }

    struct DisputePanel {
        bytes32    taskId;
        address[3] members;
        uint8[3]   votes;       // 0 = not voted, 1 = refund buyer, 2 = pay seller
        uint256    voteCount;
        bool       resolved;
        uint8      outcome;     // final ruling once resolved
    }

    // ============ State ============

    address public owner;
    IEscrow public escrow;
    IArbiToken public arbiToken;

    uint256 public minStake;

    address[] public arbitratorList;
    mapping(address => Arbitrator) public arbitrators;
    mapping(address => uint256) public arbitratorIndex; // 1-based index in arbitratorList

    mapping(bytes32 => DisputePanel) public panels;
    bytes32[] public disputeIds;

    uint256 private _nextIndex; // round-robin cursor

    // ============ Events ============

    event ArbitratorJoined(address indexed arb, uint256 staked);
    event ArbitratorLeft(address indexed arb, uint256 unstaked);
    event PanelAssigned(bytes32 indexed taskId, address arb0, address arb1, address arb2);
    event VoteCast(bytes32 indexed taskId, address indexed arb, uint8 ruling);
    event DisputeFinalized(bytes32 indexed taskId, uint8 outcome);
    event RewardPaid(address indexed arb, uint256 amount);
    event StakeSlashed(address indexed arb, uint256 amount);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Pool: not owner");
        _;
    }

    modifier onlyEscrow() {
        require(msg.sender == address(escrow), "Pool: not escrow");
        _;
    }

    // ============ Constructor ============

    constructor(address _arbiToken, uint256 _minStake) {
        owner = msg.sender;
        arbiToken = IArbiToken(_arbiToken);
        minStake = _minStake;
    }

    // ============ Admin ============

    function setEscrow(address _escrow) external onlyOwner {
        escrow = IEscrow(_escrow);
    }

    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Pool: invalid owner");
        owner = newOwner;
    }

    // ============ Arbitrator Registration ============

    /**
     * @notice Stake ARBI and join the arbitrator pool
     * @param amount Amount of ARBI to stake (must be >= minStake)
     */
    function joinPool(uint256 amount) external {
        require(amount >= minStake, "Pool: stake below minimum");
        require(!arbitrators[msg.sender].isActive, "Pool: already active");
        require(arbiToken.transferFrom(msg.sender, address(this), amount), "Pool: stake transfer failed");

        arbitrators[msg.sender].isActive = true;
        arbitrators[msg.sender].stakedAmount += amount;

        arbitratorList.push(msg.sender);
        arbitratorIndex[msg.sender] = arbitratorList.length; // 1-based

        emit ArbitratorJoined(msg.sender, amount);
    }

    /**
     * @notice Leave the pool and unstake ARBI (only if not on an active panel)
     */
    function leavePool() external {
        Arbitrator storage arb = arbitrators[msg.sender];
        require(arb.isActive, "Pool: not active");

        uint256 unstakeAmount = arb.stakedAmount;
        arb.isActive = false;
        arb.stakedAmount = 0;

        _removeFromList(msg.sender);

        if (unstakeAmount > 0) {
            arbiToken.transfer(msg.sender, unstakeAmount);
        }
        emit ArbitratorLeft(msg.sender, unstakeAmount);
    }

    /**
     * @notice Owner can directly register an arbitrator (for bootstrapping / demo)
     */
    function addArbitrator(address arb, uint256 stakeAmount) external onlyOwner {
        if (arbitrators[arb].isActive) return;

        arbitrators[arb].isActive = true;
        arbitrators[arb].stakedAmount += stakeAmount;

        arbitratorList.push(arb);
        arbitratorIndex[arb] = arbitratorList.length;

        emit ArbitratorJoined(arb, stakeAmount);
    }

    // ============ Panel Assignment ============

    /**
     * @notice Called by Escrow when a dispute is opened. Assigns a panel.
     * @param taskId The disputed task
     */
    function assignPanel(bytes32 taskId) external onlyEscrow {
        require(!panels[taskId].resolved, "Pool: panel already resolved");
        require(panels[taskId].taskId == bytes32(0), "Pool: panel already assigned");
        require(arbitratorList.length >= PANEL_SIZE, "Pool: not enough arbitrators");

        address[3] memory selected;
        uint256 cursor = _nextIndex;

        for (uint256 i = 0; i < PANEL_SIZE; i++) {
            selected[i] = arbitratorList[(cursor + i) % arbitratorList.length];
        }
        _nextIndex = (cursor + PANEL_SIZE) % arbitratorList.length;

        panels[taskId].taskId = taskId;
        panels[taskId].members = selected;
        disputeIds.push(taskId);

        emit PanelAssigned(taskId, selected[0], selected[1], selected[2]);
    }

    // ============ Voting ============

    /**
     * @notice Panel member casts their vote
     * @param taskId The disputed task
     * @param ruling 1 = refund buyer, 2 = pay seller
     */
    function castVote(bytes32 taskId, uint8 ruling) external {
        require(ruling == 1 || ruling == 2, "Pool: invalid ruling");

        DisputePanel storage panel = panels[taskId];
        require(panel.taskId != bytes32(0), "Pool: no panel assigned");
        require(!panel.resolved, "Pool: already resolved");

        int256 seatIndex = _seatOf(msg.sender, panel.members);
        require(seatIndex >= 0, "Pool: caller not on panel");

        uint256 seat = uint256(seatIndex);
        require(panel.votes[seat] == 0, "Pool: already voted");

        panel.votes[seat] = ruling;
        panel.voteCount++;

        emit VoteCast(taskId, msg.sender, ruling);

        if (panel.voteCount >= VOTE_THRESHOLD) {
            _tryFinalize(taskId);
        }
    }

    // ============ View ============

    function getPanel(bytes32 taskId) external view returns (
        address[3] memory members,
        uint8[3] memory votes,
        uint256 voteCount,
        bool resolved,
        uint8 outcome
    ) {
        DisputePanel storage p = panels[taskId];
        return (p.members, p.votes, p.voteCount, p.resolved, p.outcome);
    }

    function getArbitrator(address arb) external view returns (
        bool isActive,
        uint256 stakedAmount,
        uint256 totalVotes,
        uint256 correctVotes,
        uint256 earnedRewards
    ) {
        Arbitrator storage a = arbitrators[arb];
        return (a.isActive, a.stakedAmount, a.totalVotes, a.correctVotes, a.earnedRewards);
    }

    function poolSize() external view returns (uint256) {
        return arbitratorList.length;
    }

    function totalDisputes() external view returns (uint256) {
        return disputeIds.length;
    }

    // ============ Internal ============

    function _tryFinalize(bytes32 taskId) internal {
        DisputePanel storage panel = panels[taskId];

        uint256 refundVotes;
        uint256 payVotes;
        for (uint256 i = 0; i < PANEL_SIZE; i++) {
            if (panel.votes[i] == 1) refundVotes++;
            else if (panel.votes[i] == 2) payVotes++;
        }

        uint8 winningRuling;
        if (refundVotes >= VOTE_THRESHOLD) {
            winningRuling = 1;
        } else if (payVotes >= VOTE_THRESHOLD) {
            winningRuling = 2;
        } else {
            return; // no majority yet
        }

        panel.resolved = true;
        panel.outcome = winningRuling;

        // Escrow uses 0 = refund buyer, 1 = pay seller
        uint8 escrowRuling = winningRuling == 1 ? 0 : 1;
        escrow.resolveDispute(taskId, escrowRuling);

        _distributeRewards(taskId, winningRuling);
        emit DisputeFinalized(taskId, winningRuling);
    }

    function _distributeRewards(bytes32 taskId, uint8 winningRuling) internal {
        DisputePanel storage panel = panels[taskId];

        for (uint256 i = 0; i < PANEL_SIZE; i++) {
            address arb = panel.members[i];
            if (panel.votes[i] == 0) continue; // didn't vote

            arbitrators[arb].totalVotes++;

            if (panel.votes[i] == winningRuling) {
                arbitrators[arb].correctVotes++;
                arbitrators[arb].earnedRewards += REWARD_PER_CORRECT_VOTE;
                arbiToken.mint(arb, REWARD_PER_CORRECT_VOTE);
                emit RewardPaid(arb, REWARD_PER_CORRECT_VOTE);
            } else {
                uint256 slashAmount = SLASH_PER_WRONG_VOTE > arbitrators[arb].stakedAmount
                    ? arbitrators[arb].stakedAmount
                    : SLASH_PER_WRONG_VOTE;
                if (slashAmount > 0) {
                    arbitrators[arb].stakedAmount -= slashAmount;
                    arbiToken.burn(address(this), slashAmount);
                    emit StakeSlashed(arb, slashAmount);
                }
            }
        }
    }

    function _seatOf(address arb, address[3] memory members) internal pure returns (int256) {
        for (uint256 i = 0; i < 3; i++) {
            if (members[i] == arb) return int256(i);
        }
        return -1;
    }

    function _removeFromList(address arb) internal {
        uint256 idx = arbitratorIndex[arb];
        if (idx == 0) return;
        idx--; // convert to 0-based

        uint256 last = arbitratorList.length - 1;
        if (idx != last) {
            address moved = arbitratorList[last];
            arbitratorList[idx] = moved;
            arbitratorIndex[moved] = idx + 1;
        }
        arbitratorList.pop();
        arbitratorIndex[arb] = 0;
    }
}
