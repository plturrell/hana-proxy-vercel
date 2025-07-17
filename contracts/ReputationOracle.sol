// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ReputationOracle {
    mapping(address => uint256) public reputationScores;
    mapping(address => bool) public isRegistered;
    
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant MAX_REPUTATION = 1000;
    uint256 public constant INITIAL_REPUTATION = 100;
    
    event AgentRegistered(address indexed agent, uint256 initialScore);
    event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore);
    
    function registerAgent(string memory _name) external {
        require(!isRegistered[msg.sender], "Already registered");
        
        isRegistered[msg.sender] = true;
        reputationScores[msg.sender] = INITIAL_REPUTATION;
        
        emit AgentRegistered(msg.sender, INITIAL_REPUTATION);
    }
    
    function updateReputation(address _agent, int256 _delta) external {
        require(isRegistered[_agent], "Agent not registered");
        
        uint256 currentScore = reputationScores[_agent];
        uint256 newScore;
        
        if (_delta < 0) {
            uint256 decrease = uint256(-_delta);
            newScore = currentScore > decrease ? currentScore - decrease : MIN_REPUTATION;
        } else {
            uint256 increase = uint256(_delta);
            newScore = currentScore + increase > MAX_REPUTATION ? MAX_REPUTATION : currentScore + increase;
        }
        
        reputationScores[_agent] = newScore;
        emit ReputationUpdated(_agent, _delta, newScore);
    }
    
    function checkReputation(address _agent) external view returns (bool qualified, uint256 score) {
        score = reputationScores[_agent];
        qualified = score >= 50; // Minimum reputation threshold
    }
}
