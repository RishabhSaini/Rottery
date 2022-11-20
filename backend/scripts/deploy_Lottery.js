const hre = require("hardhat");

async function main() {
  const lottery = await hre.ethers.getContractFactory("LotteryGame");
  const LotteryGame = await lottery.deploy(
    "0x9f74407E07445b7c0Ed17540f0833b7360726f6E",
    "0x8a6CA72c7D227160b688C0ac54399c20249f705e",
    "0xAa35CD1911AaB16AAbF677589383224A75858b8E",
    300,
    "0x366A8d375e8f30B7C417909f343ADf53accf5F72"
  );

  await LotteryGame.deployed();

  console.log(`LotteryGame deployed to ${LotteryGame.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
