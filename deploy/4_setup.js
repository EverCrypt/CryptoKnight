const {
  chainNameById,
  chainIdByName,
  getDeployData,
  log,
  toBN,
  presets,
} = require("../js-helpers/deploy");

const _ = require('lodash');

module.exports = async (hre) => {
    const { ethers, getNamedAccounts } = hre;
    const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
    const network = await hre.network;

    const chainId = chainIdByName(network.name);
    const alchemyTimeout = chainId === 31337 ? 0 : 5;

    const txStartOffset = 0;
    const executeTx = async (txId, txDesc, callback = _.noop, increaseDelay = 0) => {
      if (txId === 1) {
        log(`\n`);
      }
      if (txId > txStartOffset) {
        await log(`  - [TX-${txId}] ${txDesc}`)(alchemyTimeout + increaseDelay);
        callback().catch(async err => {
          log(`  - Transaction ${txId} Failed: ${err}`);
          log(`  - Retrying;`);
          await executeTx(txId, txDesc, callback, 3);
        });
      } else {
        log(`  - [TX-${txId}] ${txDesc} (Skipping)`);
      }
    }

    const referralCode = presets.Aave.referralCode[chainId];
    const ionMaxSupply = presets.Ion.universeMaxSupply;
    const leptonMaxMint = presets.Lepton.maxMintPerTx;
    const depositCap = presets.ChargedParticles.maxDeposit;
    const tempLockExpiryBlocks = presets.ChargedParticles.tempLockExpiryBlocks;

    const ddUniverse = getDeployData('Universe', chainId);
    const ddChargedState = getDeployData('ChargedState', chainId);
    const ddChargedSettings = getDeployData('ChargedSettings', chainId);
    const ddChargedParticles = getDeployData('ChargedParticles', chainId);
    const ddAaveWalletManager = getDeployData('AaveWalletManager', chainId);
    const ddAaveBridgeV2 = getDeployData('AaveBridgeV2', chainId);
    const ddGenericWalletManager = getDeployData('GenericWalletManager', chainId);
    const ddGenericBasketManager = getDeployData('GenericBasketManager', chainId);
    const ddPhoton = getDeployData('Photon', chainId);
    const ddProton = getDeployData('Proton', chainId);
    const ddLepton = getDeployData('Lepton', chainId);
    const ddIon = getDeployData('Ion', chainId);

    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    log('Charged Particles Protocol - Contract Initialization');
    log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

    log('  Using Network: ', chainNameById(chainId));
    log('  Using Accounts:');
    log('  - Deployer:          ', deployer);
    log('  - Owner:             ', protocolOwner);
    log('  - Trusted Forwarder: ', trustedForwarder);
    log(' ');

    log('  Loading Universe from: ', ddUniverse.address);
    const Universe = await ethers.getContractFactory('Universe');
    const universe = await Universe.attach(ddUniverse.address);

    log('  Loading ChargedParticles from: ', ddChargedParticles.address);
    const ChargedParticles = await ethers.getContractFactory('ChargedParticles');
    const chargedParticles = await ChargedParticles.attach(ddChargedParticles.address);

    log('  Loading ChargedState from: ', ddChargedState.address);
    const ChargedState = await ethers.getContractFactory('ChargedState');
    const chargedState = await ChargedState.attach(ddChargedState.address);

    log('  Loading ChargedSettings from: ', ddChargedSettings.address);
    const ChargedSettings = await ethers.getContractFactory('ChargedSettings');
    const chargedSettings = await ChargedSettings.attach(ddChargedSettings.address);

    log('  Loading GenericWalletManager from: ', ddGenericWalletManager.address);
    const GenericWalletManager = await ethers.getContractFactory('GenericWalletManager');
    const genericWalletManager = await GenericWalletManager.attach(ddGenericWalletManager.address);

    log('  Loading GenericBasketManager from: ', ddGenericBasketManager.address);
    const GenericBasketManager = await ethers.getContractFactory('GenericBasketManager');
    const genericBasketManager = await GenericBasketManager.attach(ddGenericBasketManager.address);

    log('  Loading AaveWalletManager from: ', ddAaveWalletManager.address);
    const AaveWalletManager = await ethers.getContractFactory('AaveWalletManager');
    const aaveWalletManager = await AaveWalletManager.attach(ddAaveWalletManager.address);

    log('  Loading Photon from: ', ddPhoton.address);
    const Photon = await ethers.getContractFactory('Photon');
    const photon = await Photon.attach(ddPhoton.address);

    log('  Loading Proton from: ', ddProton.address);
    const Proton = await ethers.getContractFactory('Proton');
    const proton = await Proton.attach(ddProton.address);

    log('  Loading Lepton from: ', ddLepton.address);
    const Lepton = await ethers.getContractFactory('Lepton');
    const lepton = await Lepton.attach(ddLepton.address);

    log('  Loading Ion from: ', ddIon.address);
    const Ion = await ethers.getContractFactory('Ion');
    const ion = await Ion.attach(ddIon.address);


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup Charged Particles & Universe
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    await executeTx(1, 'Universe: Registering ChargedParticles', async () =>
      await universe.setChargedParticles(ddChargedParticles.address)
    );

    await executeTx(2, 'ChargedParticles: Registering Universe', async () =>
      await chargedParticles.setUniverse(ddUniverse.address)
    );

    await executeTx(3, 'ChargedParticles: Registering ChargedState', async () =>
      await chargedParticles.setChargedState(ddChargedState.address)
    );

    await executeTx(4, 'ChargedParticles: Registering ChargedSettings', async () =>
      await chargedParticles.setChargedSettings(ddChargedSettings.address)
    );

    await executeTx(5, 'ChargedParticles: Registering Lepton', async () =>
      await chargedParticles.setLeptonToken(ddLepton.address)
    );

    await executeTx(6, 'ChargedState: Registering ChargedSettings', async () =>
      await chargedState.setChargedSettings(ddChargedSettings.address)
    );

    await executeTx(7, 'ChargedParticles: Setting Deposit Cap', async () =>
      await chargedSettings.setDepositCap(depositCap)
    );

    await executeTx(8, 'ChargedParticles: Setting Temp-Lock Expiry Blocks', async () =>
      await chargedSettings.setTempLockExpiryBlocks(tempLockExpiryBlocks)
    );


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup Generic Wallet Managers
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    await executeTx(9, 'GenericWalletManager: Setting Charged Particles as Controller', async () =>
      await genericWalletManager.setController(ddChargedParticles.address)
    );

    await executeTx(10, 'GenericWalletManager: Registering Generic Wallet Manager with ChargedParticles', async () =>
      await chargedSettings.registerWalletManager('generic', ddGenericWalletManager.address)
    );

    await executeTx(11, 'GenericBasketManager: Setting Charged Particles as Controller', async () =>
      await genericBasketManager.setController(ddChargedParticles.address)
    );

    await executeTx(12, 'GenericBasketManager: Registering Generic Basket Manager with ChargedParticles', async () =>
      await chargedSettings.registerBasketManager('generic', ddGenericBasketManager.address)
    );


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup Aave Wallet Manager
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    await executeTx(13, 'AaveWalletManager: Setting Charged Particles as Controller', async () =>
      await aaveWalletManager.setController(ddChargedParticles.address)
    );

    await executeTx(14, 'AaveWalletManager: Setting Aave Bridge to V2', async () =>
      await aaveWalletManager.setAaveBridge(ddAaveBridgeV2.address)
    );

    if (referralCode.length > 0) {
      await executeTx(15, 'AaveWalletManager: Setting Referral Code', async () =>
        await aaveWalletManager.setReferralCode(referralCode)
      );
    }

    await executeTx(16, 'AaveWalletManager: Registering Aave as LP with ChargedParticles', async () =>
      await chargedSettings.registerWalletManager('aave', ddAaveWalletManager.address)
    );


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup Proton
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    await executeTx(17, 'Proton: Registering Universe', async () =>
      await proton.setUniverse(ddUniverse.address)
    );

    await executeTx(18, 'Proton: Registering ChargedState', async () =>
      await proton.setChargedState(ddChargedState.address)
    );

    await executeTx(19, 'Proton: Registering ChargedSettings', async () =>
      await proton.setChargedSettings(ddChargedSettings.address)
    );

    await executeTx(20, 'Proton: Registering ChargedParticles', async () =>
      await proton.setChargedParticles(ddChargedParticles.address)
    );

    await executeTx(21, 'ChargedSettings: Enabling Proton for Charge', async () =>
      await chargedSettings.enableNftContracts([ddProton.address])
    );

    await executeTx(22, 'Universe: Registering Proton', async () =>
      await universe.setProtonToken(ddProton.address)
    );


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup Lepton
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    await executeTx(23, 'Lepton: Setting Max Mint per Transaction', async () =>
      await lepton.setMaxMintPerTx(leptonMaxMint)
    );

    await executeTx(24, 'Universe: Registering Lepton', async () =>
      await universe.setLeptonToken(ddLepton.address)
    );

    let leptonType;
    for (let i = 0; i < presets.Lepton.types.length; i++) {
      leptonType = presets.Lepton.types[i];

      await executeTx(25 + i, `Lepton: Adding Lepton Type: ${leptonType.name}`, async () =>
        await lepton.addLeptonType(
          leptonType.tokenUri,
          leptonType.price,
          leptonType.supply,
          leptonType.multiplier,
          leptonType.bonus,
        )
      );
    }


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup Ion
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    await executeTx(31, 'Ion: Registering Universe', async () =>
      await ion.setUniverse(ddUniverse.address)
    );

    await executeTx(32, 'Universe: Registering Ion', async () =>
      await universe.setCation(ddIon.address, ionMaxSupply)
    );

    let assetTokenId;
    let assetTokenAddress;
    let assetTokenMultiplier;
    for (let i = 0; i < presets.Ion.rewardsForAssetTokens.length; i++) {
      assetTokenId = presets.Ion.rewardsForAssetTokens[i].assetTokenId;
      assetTokenAddress = _.get(presets, assetTokenId, {})[chainId];
      assetTokenMultiplier = presets.Ion.rewardsForAssetTokens[i].multiplier;

      await executeTx(33 + i, `Universe: Setting ESA Multiplier for Asset Token: ${assetTokenAddress} to: ${assetTokenMultiplier}`, async () =>
        await universe.setEsaMultiplier(assetTokenAddress, assetTokenMultiplier)
      );
    }


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup GSN Trusted Forwarder
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    await executeTx(33, 'ChargedState: Set TrustedForwarder', async () =>
      await chargedState.setTrustedForwarder(trustedForwarder)
    );

    await executeTx(34, 'ChargedSettings: Set TrustedForwarder', async () =>
      await chargedSettings.setTrustedForwarder(trustedForwarder)
    );

    await executeTx(35, 'Proton: Set TrustedForwarder', async () =>
      await proton.setTrustedForwarder(trustedForwarder)
    );

    await executeTx(36, 'Photon: Set TrustedForwarder', async () =>
      await photon.setTrustedForwarder(trustedForwarder)
    );


    log(`\n  Contract Initialization Complete!`);
    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['setup'];
