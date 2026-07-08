// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BaseMoodLoom {
    uint256 public nextEntryId = 1;

    struct MoodEntry {
        address author;
        string moodLabel;
        string note;
        string colorHex;
        uint256 strandCount;
        uint256 createdAt;
    }

    mapping(uint256 => MoodEntry) private moodEntries;
    mapping(address => uint256) private totalStrandsByAuthor;

    event MoodWoven(
        uint256 indexed entryId,
        address indexed author,
        string moodLabel,
        string note,
        string colorHex,
        uint256 strandCount
    );

    function weaveMood(
        string calldata moodLabel,
        string calldata note,
        string calldata colorHex
    ) external returns (uint256 entryId) {
        require(bytes(moodLabel).length > 0 && bytes(moodLabel).length <= 20, "Invalid mood");
        require(bytes(note).length > 0 && bytes(note).length <= 160, "Invalid note");
        require(_isHexColor(colorHex), "Invalid color");

        uint256 strandCount = totalStrandsByAuthor[msg.sender] + 1;
        totalStrandsByAuthor[msg.sender] = strandCount;

        entryId = nextEntryId++;
        moodEntries[entryId] = MoodEntry({
            author: msg.sender,
            moodLabel: moodLabel,
            note: note,
            colorHex: colorHex,
            strandCount: strandCount,
            createdAt: block.timestamp
        });

        emit MoodWoven(entryId, msg.sender, moodLabel, note, colorHex, strandCount);
    }

    function getMoodEntry(
        uint256 entryId
    )
        external
        view
        returns (
            address author,
            string memory moodLabel,
            string memory note,
            string memory colorHex,
            uint256 strandCount,
            uint256 createdAt
        )
    {
        MoodEntry storage entry = moodEntries[entryId];
        return (
            entry.author,
            entry.moodLabel,
            entry.note,
            entry.colorHex,
            entry.strandCount,
            entry.createdAt
        );
    }

    function _isHexColor(string calldata value) internal pure returns (bool) {
        bytes calldata text = bytes(value);
        if (text.length != 7 || text[0] != 0x23) return false;
        for (uint256 i = 1; i < 7; i++) {
            bytes1 char = text[i];
            bool isDigit = char >= 0x30 && char <= 0x39;
            bool isUpperHex = char >= 0x41 && char <= 0x46;
            bool isLowerHex = char >= 0x61 && char <= 0x66;
            if (!(isDigit || isUpperHex || isLowerHex)) return false;
        }
        return true;
    }
}
