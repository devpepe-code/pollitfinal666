const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy MarketToken
  const MarketToken = await hre.ethers.getContractFactory("MarketToken");
  const marketToken = await MarketToken.deploy();
  await marketToken.waitForDeployment();
  const marketTokenAddress = await marketToken.getAddress();
  console.log("MarketToken deployed to:", marketTokenAddress);

  // Deploy AMM
  const AMM = await hre.ethers.getContractFactory("AMM");
  const amm = await AMM.deploy();
  await amm.waitForDeployment();
  const ammAddress = await amm.getAddress();
  console.log("AMM deployed to:", ammAddress);

  // Deploy MarketFactory
  const MarketFactory = await hre.ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(marketTokenAddress, ammAddress);
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();
  console.log("MarketFactory deployed to:", marketFactoryAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("MarketToken:", marketTokenAddress);
  console.log("AMM:", ammAddress);
  console.log("MarketFactory:", marketFactoryAddress);
  console.log("\nCopy these addresses to your .env files!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

