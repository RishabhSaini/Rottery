const hre = require("hardhat");

async function main() {
  const token = await hre.ethers.getContractFactory("MOKToken");
  //Ethersjs parseUnit(value in eth)
  const MOKToken = await token.deploy("10000000000000000000000000000000000000");

  await MOKToken.deployed();

  console.log(`MOKToken deployed to ${MOKToken.address}`);

  // const lottery = await hre.ethers.getContractFactory("LotteryGame");
  // const LotteryGame = await lottery.deploy();

  // await LotteryGame.deployed();

  // console.log(
  //   `LotteryGame deployed to ${LotteryGame.address}`
  // );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
