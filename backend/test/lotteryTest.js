const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert } = require("chai");

describe("LotteryContract", function () {
  async function deployLotteryFixture() {
    const drawTime = 100;

    // Contracts are deployed using the first signer/account by default
    const [owner, manager1, manager2, bidder1, bidder2] =
      await ethers.getSigners();

    const Lottery = await ethers.getContractFactory("LotteryGame");
    const MOKToken = await ethers.getContractFactory("MOKToken");
    const token = await MOKToken.deploy(ethers.utils.parseEther("1.0"));
    const lottery = await Lottery.deploy(
      owner.address,
      manager1.address,
      manager2.address,
      drawTime,
      token.address
    );

    return {
      token,
      lottery,
      owner,
      manager1,
      manager2,
      bidder1,
      bidder2,
      drawTime,
    };
  }

  describe("Deployment", function () {
    it("testingDeploy", async function () {
      const {
        token,
        lottery,
        owner,
        manager1,
        manager2,
        bidder1,
        bidder2,
        drawTime,
      } = await loadFixture(deployLotteryFixture);

      expect(await lottery.owner()).to.equal(owner.address);
      expect(await lottery.token()).to.equal(token.address);
      expect(await lottery.manager1()).to.equal(manager1.address);
      expect(await lottery.manager2()).to.equal(manager2.address);
      const prevLottery = await lottery.prevDrawnLottery();
      expect(prevLottery.lotteryId.isZero()).to.be.true;
      expect(prevLottery.price).to.equal("0");
      expect(prevLottery.prize).to.equal(0);
      expect(prevLottery.drawTime).to.equal(0);
      expect(prevLottery.players).to.equal(undefined);
      expect(prevLottery.lotteryId).to.equal(ethers.constants.AddressZero);
      expect(await lottery.fees()).to.equal(0);
      expect(await lottery.lotteryDrawnWaitTime()).to.equal(drawTime);
    });
    it("Draw", async function () {
      const {
        token,
        lottery,
        owner,
        manager1,
        manager2,
        bidder1,
        bidder2,
        drawTime,
      } = await loadFixture(deployLotteryFixture);

      token.connect(owner).transfer(bidder1.address, 40);
      token.connect(owner).transfer(bidder2.address, 20);

      let ownerBalance = await token.balanceOf(owner.address);
      let lotteryBalance = await token.balanceOf(lottery.address);
      let bidder1Balance = await token.balanceOf(bidder1.address);
      let bidder2Balance = await token.balanceOf(bidder2.address);
      console.log(
        "Owner: %d, lottery: %d, Bidder1: %d, Bidder2: %d",
        ownerBalance,
        lotteryBalance,
        bidder1Balance,
        bidder2Balance
      );

      const id0 = 0;

      await expect(lottery.createLottery())
        .to.emit(lottery, "LotteryCreated")
        .withArgs(id0, 20);

      await expect(token.connect(bidder1).approve(lottery.address, 20 * 2))
        .to.emit(token, "Approval")
        .withArgs(bidder1.address, lottery.address, 20 * 2);

      await expect(lottery.connect(bidder1).participate(0, 2))
        .to.emit(lottery, "PrizeIncreased")
        .withArgs(id0, 0.95 * 40);

      await expect(token.connect(bidder2).approve(lottery.address, 20))
        .to.emit(token, "Approval")
        .withArgs(bidder2.address, lottery.address, 20);

      let bid2 = lottery.connect(bidder2).participate(0, 1);
      await expect(bid2)
        .to.emit(lottery, "PrizeIncreased")
        .withArgs(id0, 0.95 * (20 * 3));

      expect(
        (await time.latest()) ==
          (await ethers.provider.getBlock(bid2.value)).timestamp
      );
      let prevTime = await time.latest();

      //Draw1
      await time.increase(50);
      await expect(lottery.connect(owner).declareWinner(0))
        .to.emit(lottery, "WinnerDeclared")
        .withArgs(id0, prevTime + 51 + 100, 0.95 * (20 * 3), bidder1.address);
      let prevLottery = await lottery.prevDrawnLottery();
      console.log(prevLottery);
      prevTime += prevTime + 51;

      //Draw 2
      await time.increase(50);
      let draw1 = lottery.connect(owner).declareWinner(0);
      await expect(draw1)
        .to.emit(lottery, "WinnerDeclared")
        .withArgs(id0, prevTime + 51 + 100, 0.95 * (20 * 3), bidder1.address);
      prevLottery = await lottery.prevDrawnLottery();
      console.log(prevLottery);

      // ownerBalance = await token.balanceOf(owner.address);
      // lotteryBalance = await token.balanceOf(lottery.address);
      // bidder1Balance = await token.balanceOf(bidder1.address);
      // bidder2Balance = await token.balanceOf(bidder2.address);
      // console.log(
      //   "Owner: %d, lottery: %d, Bidder1: %d, Bidder2: %d",
      //   ownerBalance,
      //   lotteryBalance,
      //   bidder1Balance,
      //   bidder2Balance
      // );
    });
  });
});
