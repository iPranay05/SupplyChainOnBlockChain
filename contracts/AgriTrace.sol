// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AgriTrace {
    struct Batch {
        uint256 id;
        string batchNumber;
        string produce;
        string variety;
        uint256 quantity;
        uint256 currentPrice;
        address farmer;
        string farmerName;
        string farmLocation;
        string gpsCoordinates;
        uint256 harvestDate;
        string qualityGrade;
        bool isOrganic;
        BatchStatus status;
        address currentHolder;
        uint256 createdAt;
        string qualityReportHash;
    }

    struct HandoffEvent {
        uint256 id;
        uint256 batchId;
        address from;
        address to;
        string fromName;
        string toName;
        string eventType; // "Pickup", "Transit", "Delivery", "Sale"
        uint256 price;
        string location;
        string gpsCoordinates;
        string temperature;
        string notes;
        uint256 timestamp;
        string photoHash;
        string documentHash;
    }

    enum BatchStatus { Harvested, InTransit, AtDistributor, AtRetailer, Sold }

    mapping(uint256 => Batch) public batches;
    mapping(uint256 => HandoffEvent[]) public batchHandoffs;
    mapping(address => string) public stakeholderNames;
    mapping(address => uint8) public stakeholderRoles; // 0: Farmer, 1: Distributor, 2: Retailer, 3: Consumer
    mapping(address => string) public stakeholderLocations;
    mapping(string => uint256) public batchNumberToId;

    uint256 public batchCounter;
    uint256 public handoffCounter;

    event BatchCreated(uint256 indexed batchId, string batchNumber, address indexed farmer, string produce);
    event HandoffRecorded(uint256 indexed batchId, address indexed from, address indexed to, string eventType);
    event StakeholderRegistered(address indexed stakeholder, string name, uint8 role, string location);

    function registerStakeholder(string memory _name, uint8 _role, string memory _location) public {
        require(_role <= 3, "Invalid role");
        stakeholderNames[msg.sender] = _name;
        stakeholderRoles[msg.sender] = _role;
        stakeholderLocations[msg.sender] = _location;
        emit StakeholderRegistered(msg.sender, _name, _role, _location);
    }

    function createBatch(
        string memory _produce,
        string memory _variety,
        uint256 _quantity,
        uint256 _price,
        string memory _farmLocation,
        string memory _gpsCoordinates,
        string memory _qualityGrade,
        bool _isOrganic,
        string memory _qualityReportHash
    ) public returns (uint256, string memory) {
        require(stakeholderRoles[msg.sender] == 0, "Only farmers can create batches");
        
        batchCounter++;
        
        // Generate batch number: BATCH_PRODUCE_TIMESTAMP_ID
        string memory batchNumber = string(abi.encodePacked(
            "BATCH_", 
            _produce, 
            "_", 
            toString(block.timestamp / 86400), // Days since epoch
            "_", 
            toString(batchCounter)
        ));
        
        batches[batchCounter] = Batch({
            id: batchCounter,
            batchNumber: batchNumber,
            produce: _produce,
            variety: _variety,
            quantity: _quantity,
            currentPrice: _price,
            farmer: msg.sender,
            farmerName: stakeholderNames[msg.sender],
            farmLocation: _farmLocation,
            gpsCoordinates: _gpsCoordinates,
            harvestDate: block.timestamp,
            qualityGrade: _qualityGrade,
            isOrganic: _isOrganic,
            status: BatchStatus.Harvested,
            currentHolder: msg.sender,
            createdAt: block.timestamp,
            qualityReportHash: _qualityReportHash
        });

        batchNumberToId[batchNumber] = batchCounter;

        emit BatchCreated(batchCounter, batchNumber, msg.sender, _produce);
        return (batchCounter, batchNumber);
    }

    function recordHandoff(
        uint256 _batchId,
        address _to,
        string memory _eventType,
        uint256 _price,
        string memory _location,
        string memory _gpsCoordinates,
        string memory _temperature,
        string memory _notes,
        string memory _photoHash,
        string memory _documentHash
    ) public {
        require(_batchId <= batchCounter && _batchId > 0, "Batch does not exist");
        require(stakeholderNames[_to].length > 0, "Recipient not registered");
        
        Batch storage batch = batches[_batchId];
        require(batch.currentHolder == msg.sender, "Only current holder can transfer");
        require(canTransfer(msg.sender, _to, batch.status), "Invalid transfer");

        handoffCounter++;
        
        batchHandoffs[_batchId].push(HandoffEvent({
            id: handoffCounter,
            batchId: _batchId,
            from: msg.sender,
            to: _to,
            fromName: stakeholderNames[msg.sender],
            toName: stakeholderNames[_to],
            eventType: _eventType,
            price: _price,
            location: _location,
            gpsCoordinates: _gpsCoordinates,
            temperature: _temperature,
            notes: _notes,
            timestamp: block.timestamp,
            photoHash: _photoHash,
            documentHash: _documentHash
        }));

        // Update batch status and holder
        uint8 toRole = stakeholderRoles[_to];
        if (toRole == 1) {
            batch.status = BatchStatus.InTransit;
        } else if (toRole == 2) {
            batch.status = BatchStatus.AtRetailer;
        } else if (toRole == 3) {
            batch.status = BatchStatus.Sold;
        }

        batch.currentHolder = _to;
        batch.currentPrice = _price;

        emit HandoffRecorded(_batchId, msg.sender, _to, _eventType);
    }

    function canTransfer(address _from, address _to, BatchStatus _status) internal view returns (bool) {
        uint8 fromRole = stakeholderRoles[_from];
        uint8 toRole = stakeholderRoles[_to];
        
        // Farmer to Distributor
        if (_status == BatchStatus.Harvested && fromRole == 0 && toRole == 1) return true;
        // Distributor to Retailer
        if ((_status == BatchStatus.InTransit || _status == BatchStatus.AtDistributor) && fromRole == 1 && toRole == 2) return true;
        // Retailer to Consumer
        if (_status == BatchStatus.AtRetailer && fromRole == 2 && toRole == 3) return true;
        
        return false;
    }

    function getBatch(uint256 _batchId) public view returns (Batch memory) {
        require(_batchId <= batchCounter && _batchId > 0, "Batch does not exist");
        return batches[_batchId];
    }

    function getBatchByNumber(string memory _batchNumber) public view returns (Batch memory) {
        uint256 batchId = batchNumberToId[_batchNumber];
        require(batchId > 0, "Batch not found");
        return batches[batchId];
    }

    function getBatchHandoffs(uint256 _batchId) public view returns (HandoffEvent[] memory) {
        require(_batchId <= batchCounter && _batchId > 0, "Batch does not exist");
        return batchHandoffs[_batchId];
    }

    function getStakeholderInfo(address _stakeholder) public view returns (string memory, uint8, string memory) {
        return (stakeholderNames[_stakeholder], stakeholderRoles[_stakeholder], stakeholderLocations[_stakeholder]);
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}