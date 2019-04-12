// For each division by 10, add one to exponent to truncate one significant figure
import {BigDecimal, BigInt} from "@graphprotocol/graph-ts/index";
import {CTokenStats, Market, User} from "../types/schema";

export function truncateBigDecimal(bd: BigDecimal, truncateAmount: i32): BigDecimal {

  // This will shave off the actual digits, so our big number is getting smaller
  for (let i = 0; i < truncateAmount; i++) {
    bd.digits = bd.digits.div(BigInt.fromI32(10))
  }

  // This adds to the exponent, which is negative for numbers below zero
  // and moves the decimal point to be in line with the fact that the digits BigInt got 1 length shorter
  bd.exp = bd.exp.plus(BigInt.fromI32(truncateAmount))
  return bd
}

/*
Because a SimplePriceOracle is used for rinkeby, we just hardcode these values in
TODO - on mainnet, we must source the PriceOracle events to get USD values
cBAT = 2000000000000000*10^-18 = 0.002 bat/eth
cDAI = 7000000000000000*10^-18 = 0.007 dai/eth - note, this essentially means 1 USD = .007, or 1 ETH = $142.857
cETH = 1000000000000000000*10^-18 = 1 eth/eth
cREP = 102000000000000000*10^-18 = .102 rep/eth
cZRX = 2200000000000000*10^-18 = 0.0022 zrx/eth
 */

export function getTokenEthRatio(symbol: string): BigDecimal {
  if (symbol == "cBAT") {
    return BigDecimal.fromString("0.002")
  } else if (symbol == "cDAI") {
    return BigDecimal.fromString("0.007")
  } else if (symbol == "cREP") {
    return BigDecimal.fromString("0.102")
  } else {
    return BigDecimal.fromString("0.0022") // else must be cZRX here
  }
}


export function calculateLiquidty(userAddr: string):void{
  let totalSupplyInEth = BigDecimal.fromString("0")
  let totalBorrowInEth = BigDecimal.fromString("0")

  let dai = CTokenStats.load('cDAI-'.concat(userAddr))
  if (dai != null){
    let daiMarket = Market.load("0xb5e5d0f8c0cba267cd3d7035d6adc8eba7df7cdd") //9941
    let daiEthRatio = daiMarket.tokenPerEthRatio
    let daiBorrowInEth = dai.borrowBalance.times(daiEthRatio)
    let daiSupplyInEth = dai.underlyingBalance.times(daiEthRatio)

    totalBorrowInEth = totalBorrowInEth.plus(daiBorrowInEth)
    totalSupplyInEth = totalSupplyInEth.plus(daiSupplyInEth)
  }

  let rep = CTokenStats.load('cREP-'.concat(userAddr))
  if (rep != null){
    let repMarket = Market.load("0x0a1e4d0b5c71b955c0a5993023fc48ba6e380496") //9941
    let repEthRatio = repMarket.tokenPerEthRatio
    let repBorrowInEth = rep.borrowBalance.times(repEthRatio)
    let repSupplyInEth = rep.underlyingBalance.times(repEthRatio)

    totalBorrowInEth = totalBorrowInEth.plus(repBorrowInEth)
    totalSupplyInEth = totalSupplyInEth.plus(repSupplyInEth)
  }

  let zrx = CTokenStats.load('cZRX-'.concat(userAddr))
  if (zrx != null){
    let zrxMarket = Market.load("0x19787bcf63e228a6669d905e90af397dca313cfc") //9941
    let zrxEthRatio = zrxMarket.tokenPerEthRatio
    let zrxBorrowInEth = zrx.borrowBalance.times(zrxEthRatio)
    let zrxSupplyInEth = zrx.underlyingBalance.times(zrxEthRatio)

    totalBorrowInEth = totalBorrowInEth.plus(zrxBorrowInEth)
    totalSupplyInEth = totalSupplyInEth.plus(zrxSupplyInEth)
  }
  let eth = CTokenStats.load('cETH-'.concat(userAddr))
  if (eth != null){
    let ethMarket = Market.load("0x8a9447df1fb47209d36204e6d56767a33bf20f9f") //9941
    let ethEthRatio = ethMarket.tokenPerEthRatio
    let ethBorrowInEth = eth.borrowBalance.times(ethEthRatio)
    let ethSupplyInEth = eth.underlyingBalance.times(ethEthRatio)

    totalBorrowInEth = totalBorrowInEth.plus(ethBorrowInEth)
    totalSupplyInEth = totalSupplyInEth.plus(ethSupplyInEth)
  }
  let bat = CTokenStats.load('cBAT-'.concat(userAddr))
  if (bat != null){
    let batMarket = Market.load("0x9636246bf34e688c6652af544418b38eb51d2c43") //9941
    let batEthRatio = batMarket.tokenPerEthRatio
    let batBorrowInEth = bat.borrowBalance.times(batEthRatio)
    let batSupplyInEth = bat.underlyingBalance.times(batEthRatio)

    totalBorrowInEth = totalBorrowInEth.plus(batBorrowInEth)
    totalSupplyInEth = totalSupplyInEth.plus(batSupplyInEth)
  }

  let user = User.load(userAddr)
  user.totalBorrowInEth = totalBorrowInEth
  user.totalSupplyInEth = totalSupplyInEth
  user.accountLiquidity = totalSupplyInEth.div(totalBorrowInEth)
  user.availableToBorrowEth = user.totalSupplyInEth.div(BigDecimal.fromString("1.5")).minus(user.totalBorrowInEth)
  user.save()
}