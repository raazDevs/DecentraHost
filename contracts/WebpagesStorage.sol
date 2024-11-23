//
pragma solidity ^0.8.27;

contract WebpageStorage {
    struct Webpage {
        string cid;
        address owner;
        uint256 timestamp;
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
    }

    mapping(string => Webpage) public webpages;
    mapping(address => string[]) public userWebpages;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public hasVoted;

    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant EXECUTION_DELAY = 2 days;

    event WebpageStored(string domain, string cid, address owner, uint256 timestamp);
    event ProposalCreated(uint256 indexed proposalId, address proposer, string description);
    event Voted(uint256 indexed proposalId, address voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);

    function storeWebpage(string memory domain, string memory cid) public {
        require(bytes(domain).length > 0, "Domain cannot be empty");
        require(bytes(cid).length > 0, "CID cannot be empty");
        
        webpages[domain] = Webpage(cid, msg.sender, block.timestamp);
        userWebpages[msg.sender].push(domain);
        
        emit WebpageStored(domain, cid, msg.sender, block.timestamp);
    }

    function getWebpage(string memory domain) public view returns (string memory, address, uint256) {
        Webpage memory webpage = webpages[domain];
        require(bytes(webpage.cid).length > 0, "Webpage not found");
        return (webpage.cid, webpage.owner, webpage.timestamp);
    }

    function getUserWebpages(address user) public view returns (string[] memory) {
        return userWebpages[user];
    }
}