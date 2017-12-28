const util = require("ethereumjs-util");
const ABI = require('ethereumjs-abi');

const Exchange = artifacts.require("./Exchange");
const TokenA = artifacts.require("./lib/helpers/TokenA");
const TokenB = artifacts.require("./lib/helpers/TokenB");

contract('Exchange', function(accounts) {

  let maker = accounts[0]
  let taker = accounts[1]

  let exchange;
  let tokenA;
  let tokenB;

  it("deploys exchange contract", function (done) {
    Exchange.deployed().then(function(instance) {
      exchange = instance;
      done();
    });
  });

  it("deploys and mints 1000 tokenA tokens for maker", function (done) {

    TokenA.deployed().then(function (instance) {
      tokenA = instance;
      return instance.create(maker, 1000);

    }).then(function () {
      return tokenA.balanceOf(maker);

    }).then(function (balance) {
      assert.equal(balance, 1000, "failed to mint 1000 tokenA for maker!");
      done();

    }).catch(done);

  });

  it("deploys and mints 1000 tokenB tokens for taker", function (done) {

    TokenB.deployed().then(function (instance) {
      tokenB = instance;
      return instance.create(taker, 1000);

    }).then(function () {
      return tokenB.balanceOf(taker);

    }).then(function (balance) {
      assert.equal(balance, 1000, "failed to mint 1000 tokenB for taker!");
      done();

    }).catch(done);

  });

  it("approves exchange to withdraw 250 tokenA from maker", function (done) {
    tokenA.approve(exchange.address, 250, { from: maker }).then(function(transaction) {
      assert.ok(transaction.logs.find(function (log) {
        return log.event === 'Approval';
      }));
      done();
    }).catch(done);
  });

  it("approves exchange to withdraw 750 tokenB from taker", function (done) {
    tokenB.approve(exchange.address, 750, { from: taker }).then(function(transaction) {
      assert.ok(transaction.logs.find(function (log) {
        return log.event === 'Approval';
      }));
      done();
    }).catch(done);
  });

  it("fills an order for 250 tokenA from maker and 750 tokenB from taker", function(done) {

    // Order parameters.
    let makerAddress = maker;
    let makerAmount = 250;
    let makerToken = tokenA.address;
    let takerAddress = taker;
    let takerAmount = 750;
    let takerToken = tokenB.address;
    let expiration = new Date().getTime() + 60000;
    let nonce = 1;

    // Message hash for signing.
    let message = makerAddress + makerAmount + makerToken +
      takerAddress + takerAmount + takerToken + expiration + nonce;

    const args = [makerAddress, makerAmount, makerToken,
      takerAddress, takerAmount, takerToken, expiration, nonce];
    const argTypes = ['address', 'uint', 'address', 'address',
      'uint', 'address', 'uint256', 'uint256'];
    const msg = ABI.soliditySHA3(argTypes, args);

    const sig = web3.eth.sign(makerAddress, util.bufferToHex(msg));
    const { v, r, s } = util.fromRpcSig(sig);

    exchange.fill(makerAddress, makerAmount, makerToken,
      takerAddress, takerAmount, takerToken,
      expiration, nonce, v, util.bufferToHex(r), util.bufferToHex(s), {
        from: takerAddress,
        gasLimit: web3.toHex(200000),
        gasPrice: web3.eth.gasPrice
      }).then(function(transaction) {
        assert.ok(transaction.logs.find(function (log) {
          return log.event === 'Filled';
        }));
        done();
      }).catch(done);

  });

  it("checks that maker now has a balance of 750 tokenA and 750 tokenB", function (done) {
    tokenA.balanceOf(maker).then(function (balance) {
      return assert(balance.equals(750), "Balance is incorrect: " + balance.toString());
    }).then(function () {
      tokenB.balanceOf(maker).then(function (balance) {
        assert(balance.equals(750), "Balance is incorrect: " + balance.toString());
        done();
      }).catch(done);
    }).catch(done);
  });

  it("checks that taker now has a balance of 250 tokenA and 250 tokenB", function (done) {
    tokenA.balanceOf(taker).then(function (balance) {
      return assert(balance.equals(250), "Balance is incorrect: " + balance.toString());
    }).then(function () {
      tokenB.balanceOf(taker).then(function (balance) {
        assert(balance.equals(250), "Balance is incorrect: " + balance.toString());
        done();
      }).catch(done);
    }).catch(done);
  });

  it("approves exchange to withdraw 750 tokenA from maker", function (done) {
    tokenA.approve(exchange.address, 750, { from: maker }).then(function(transaction) {
      assert.ok(transaction.logs.find(function (log) {
        return log.event === 'Approval';
      }));
      done();
    }).catch(done);
  });

  it("fills an order for remaining 750 tokenA in exchange for ether", function (done) {

    // Order parameters.
    let makerAddress = maker;
    let makerAmount = 750;
    let makerToken = tokenA.address;
    let takerAddress = taker;
    let takerAmount = 750;
    let takerToken = null;
    let expiration = new Date().getTime() + 60000;
    let nonce = 1;

    // Message hash for signing.
    let message = makerAddress + makerAmount + makerToken +
      takerAddress + takerAmount + takerToken + expiration + nonce;

    const args = [makerAddress, makerAmount, makerToken,
      takerAddress, takerAmount, takerToken, expiration, nonce];
    const argTypes = ['address', 'uint', 'address', 'address',
      'uint', 'address', 'uint256', 'uint256'];
    const msg = ABI.soliditySHA3(argTypes, args);

    const sig = web3.eth.sign(makerAddress, util.bufferToHex(msg));
    const { v, r, s } = util.fromRpcSig(sig);

    exchange.fill(makerAddress, makerAmount, makerToken,
      takerAddress, takerAmount, takerToken,
      expiration, nonce, v, util.bufferToHex(r), util.bufferToHex(s), {
        from: takerAddress,
        value: takerAmount,
        gasLimit: web3.toHex(200000),
        gasPrice: web3.eth.gasPrice
      }).then(function(transaction) {
        assert.ok(!!transaction.logs.find(function (log) {
          return log.event === 'Filled';
        }));
        done();
      }).catch(done);

  });

  it("checks that taker now has a balance of 1000 tokenA", function (done) {
    tokenA.balanceOf(taker).then(function (balance) {
      assert(balance.equals(1000), "Balance is incorrect: " + balance.toString());
      done();
    }).catch(done);
  });


});
