// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MOKToken.sol";

//multiple lotteries change accordingly make a struct
//verify using hardhat-etherscan to visible code on etherscan

contract LotteryGame {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    IERC20 public token;
    address payable public owner;
    address public manager1;
    address public manager2;

    Counters.Counter public lotteryId;
    uint256 public fees;
    mapping(uint256 => Lottery) public lotteries;
    mapping(uint256 => mapping(address => uint256)) public partPerPlayer;
    Lottery public prevDrawnLottery;
    uint256 public lotteryDrawnWaitTime;

    event WinnerDeclared(uint256, uint256, uint256, address);
    event PrizeIncreased(uint256, uint256);
    event LotteryCreated(uint256, uint256);
    event Approved(uint256, uint256);
    event PriceIncreased(uint256, uint256);

    struct Lottery {
        uint256 lotteryId;
        uint256 price;
        uint256 prize;
        uint256 drawTime;
        address payable[] players;
        address winner;
    }

    constructor(
        address _owner,
        address _manager1,
        address _manager2,
        uint256 _lotteryDrawnWaitTime,
        IERC20 _tokenAddress
    ) {
        owner = payable(_owner);
        token = _tokenAddress;
        manager1 = _manager1;
        manager2 = _manager2;
        lotteryDrawnWaitTime = _lotteryDrawnWaitTime;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can call this function");
        _;
    }

    modifier onlyDrawOwners() {
        require(
            msg.sender == owner ||
                msg.sender == manager1 ||
                msg.sender == manager2,
            "Only Owner and maangers can call this function"
        );
        _;
    }

    function createLottery() public onlyOwner {
        Lottery memory lottery = Lottery({
            lotteryId: lotteryId.current(),
            players: new address payable[](0),
            price: 20,
            prize: 0,
            winner: address(0),
            drawTime: 0
        });

        lotteries[lotteryId.current()] = lottery;
        lotteryId.increment();
        emit LotteryCreated(lottery.lotteryId, lottery.price);
    }

    //modifier cost a lot of gas fee. Use private funcs/internal funcs.

    //revert instead of require cuz of gas fee
    //Make it poasaible to buy several tickets at once
    function participate(uint256 _lotteryId, uint256 noTickets) public payable {
        Lottery storage lottery = lotteries[_lotteryId];
        require(
            token.transferFrom(
                msg.sender,
                address(this),
                lottery.price.mul(noTickets)
            ),
            "Value must be equal to ticket price"
        );
        for (uint i = 0; i < noTickets; i++) {
            lottery.players.push(payable(msg.sender));
        }

        //Warning: No magic numberss
        lottery.prize += lottery.price.mul(noTickets).mul(95).div(100);
        fees += lottery.price.mul(noTickets).mul(5).div(100);
        partPerPlayer[lottery.lotteryId][msg.sender] += noTickets;
        emit PrizeIncreased(lottery.lotteryId, lottery.prize);
    }

    function getRandomNumber() public view returns (uint) {
        return uint256(keccak256(abi.encode(owner, block.timestamp)));
    }

    function declareWinner(uint256 _lotteryId) public onlyDrawOwners {
        Lottery storage currLottery = lotteries[_lotteryId];

        if (prevDrawnLottery.drawTime != 0) {
            require(
                block.timestamp >
                    prevDrawnLottery.drawTime +
                        lotteryDrawnWaitTime *
                        1 seconds,
                "Before draw Time freeze"
            );
        }
        currLottery.drawTime = block.timestamp;
        uint256 index = getRandomNumber() % currLottery.players.length;
        address payable winner = currLottery.players[index];
        currLottery.winner = winner;
        token.transfer(winner, currLottery.prize);
        prevDrawnLottery = currLottery;

        emit WinnerDeclared(
            _lotteryId,
            block.timestamp + lotteryDrawnWaitTime * 1 seconds,
            currLottery.prize,
            currLottery.winner
        );
        //re-entrence attack.
        //reset
    }

    function withdrawUsageFees() public onlyOwner {
        owner.transfer(fees);
    }

    function changeTicketPrice(uint256 _lotteryId, uint256 price)
        public
        onlyOwner
    {
        Lottery storage lottery = lotteries[_lotteryId];
        lottery.price = price;
        emit PriceIncreased(_lotteryId, lottery.price);
    }
}
