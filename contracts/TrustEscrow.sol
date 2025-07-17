// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TrustEscrow {
    struct EscrowTask {
        bytes32 taskId;
        address initiator;
        address processor;
        uint256 amount;
        uint256 deadline;
        bool completed;
        string dataHash;
    }
    
    mapping(bytes32 => EscrowTask) public tasks;
    mapping(address => uint256) public deposits;
    
    event EscrowCreated(bytes32 indexed taskId, address initiator, address processor, uint256 amount);
    event TaskCompleted(bytes32 indexed taskId, address processor, uint256 amount);
    
    function createEscrow(
        bytes32 _taskId,
        address _processor,
        uint256 _deadline,
        string memory _dataHash
    ) external payable {
        require(msg.value > 0, "Escrow amount required");
        require(_deadline > block.timestamp, "Invalid deadline");
        
        tasks[_taskId] = EscrowTask({
            taskId: _taskId,
            initiator: msg.sender,
            processor: _processor,
            amount: msg.value,
            deadline: _deadline,
            completed: false,
            dataHash: _dataHash
        });
        
        deposits[msg.sender] += msg.value;
        emit EscrowCreated(_taskId, msg.sender, _processor, msg.value);
    }
    
    function completeTask(bytes32 _taskId) external {
        EscrowTask storage task = tasks[_taskId];
        require(msg.sender == task.processor, "Not authorized");
        require(!task.completed, "Already completed");
        require(block.timestamp <= task.deadline, "Deadline passed");
        
        task.completed = true;
        payable(task.processor).transfer(task.amount);
        
        emit TaskCompleted(_taskId, task.processor, task.amount);
    }
}
