// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract A2AOrchestrator {
    struct Process {
        bytes32 processId;
        string name;
        address creator;
        mapping(bytes32 => bool) taskCompleted;
        bytes32[] taskIds;
        bool active;
    }
    
    mapping(bytes32 => Process) public processes;
    mapping(address => bytes32[]) public agentProcesses;
    
    event ProcessCreated(bytes32 indexed processId, string name, address creator);
    event TaskAdded(bytes32 indexed processId, bytes32 taskId);
    event ProcessCompleted(bytes32 indexed processId);
    
    function createProcess(string memory _name) external returns (bytes32) {
        bytes32 processId = keccak256(abi.encodePacked(msg.sender, _name, block.timestamp));
        
        Process storage newProcess = processes[processId];
        newProcess.processId = processId;
        newProcess.name = _name;
        newProcess.creator = msg.sender;
        newProcess.active = true;
        
        agentProcesses[msg.sender].push(processId);
        
        emit ProcessCreated(processId, _name, msg.sender);
        return processId;
    }
    
    function addTask(bytes32 _processId, bytes32 _taskId) external {
        Process storage process = processes[_processId];
        require(process.active, "Process not active");
        require(msg.sender == process.creator, "Not authorized");
        
        process.taskIds.push(_taskId);
        emit TaskAdded(_processId, _taskId);
    }
}
