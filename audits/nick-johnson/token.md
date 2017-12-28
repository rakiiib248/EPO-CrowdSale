# Introduction

On 2017-09-26, Nick Johnson performed an audit of the epoch token smart
contract. My findings are detailed below.

I, Nick Johnson have no stake or vested interest in epoch or ConsenSys. This audit
was performed under a contracted hourly rate with no other compensation.

## Authenticity

This document should have an attached cryptographic signature to ensure it has
not been tampered with.  The signature can be verified using the public key from
[Nick Johnson's keybase.io record](https://keybase.io/arachnid).

## Audit Goals and Focus

### Smart Contract Best Practices

This audit will evaluate whether the codebase follows the current established
best practices for smart contract development.

### Code Correctness

This audit will evaluate whether the code does what it is intended to do.

### Code Quality

This audit will evaluate whether the code has been written in a way that
ensures readability and maintainability.

### Security

This audit will look for any exploitable security vulnerabilities, or other
potential threats to either the operators of ChainLink or its users.

### Testing and testability

This audit will examine how easily tested the code is, and review how thoroughly
tested the code is.

## About epoch

epoch is a decentralised exchange that uses offchain signatures to authorise
swaps of tokens between independent parties. Users are divided into 'makers' and
'takers'; makers broadcepo intent to trade and sign messages authorising
trades, while takers agree to a specified trade by submitting it to the epoch
contract.

The epoch token contract provides an ERC20 compatible token contract, with additional features to lock up tokens for fixed periods.

## Terminology

This audit uses the following terminology.

### Likelihood

How likely a bug is to be encountered or exploited in the wild, as specified by the
[OWASP risk rating methodology](https://www.owasp.org/index.php/OWASP_Risk_Rating_Methodology#Step_2:_Factors_for_Estimating_Likelihood).

### Impact

The impact a bug would have if exploited, as specified by the
[OWASP risk rating methodology](https://www.owasp.org/index.php/OWASP_Risk_Rating_Methodology#Step_3:_Factors_for_Estimating_Impact).

### Severity

How serious the issue is, derived from Likelihood and Impact as specified by the [OWASP risk rating methodology](https://www.owasp.org/index.php/OWASP_Risk_Rating_Methodology#Step_4:_Determining_the_Severity_of_the_Risk).

# Overview

## Source Code

The epoch smart contract source code was made available in the [epoch/protocol](https://github.com/epoch/protocol/) Github repository.

The code was audited as of commit `6bdee4e9ab0bfdb4e5af1cd2a0133294f037e269`.

The following files were audited:
```
SHA1(contracts/epochToken.sol)= 72a6aeb815c4e7a31de5730edd926b1f5b74769c
SHA1(contracts/lib/StandardToken.sol)= 2d8310edcaaac100cc1a830f2506b0b1010af54e
SHA1(contracts/lib/Token.sol)= 757c7ca8ea7169b04305f1c02b4965a1237f01d9
```

## General Notes

The code is readable and was easy to audit, with well placed comments and small, clearly written functions. Several `require` conditions that were used in several places could have been refactored into modifiers for further clarity and less repetition of code.

We note that the token locking mechanism could be bypassed by creating a wrapping token that lacks the lock mechanism, and permits people to transfer tokens to and from the wrapping token contract. Whether this is a concern or not depends on the overall goals of the locking mechanism.

It is also worth noting that the locking mechanism utilises a fixed lock-up period; this could be generalised to a variable lock-up period with no increase in complexity by simply making the `BalanceLock` structure store an unlock date instead of a lock date, and accepting an unlock date in the `lockTokens` function.

## Contracts

`epochToken` implements the token functionality.

## Testing

A fairly complete set of unit tests is provided. Unit tests are clearly written
and easy to follow. Happy cases are tested along with most simple failures.

Notably, initial token lockup time is hardcoded into the token contract, rather than supplied as a cconstructor parameter, and is set to a fixed timestamp, which the tests validate. As a result, these unit tests will begin failing after the lockup period concludes. Tests should not depend on wallclock time, and this should be remedied by either using fake time, or making the token contract accept an unlock time as a constructor argument.

Testing requires running a separate server process. No automated build is set up
for the repository.

We recommend setting up an automated build, so new commits can be vetted against
the existing test suite.

# Findings

We found one note issue, four low issues, and one medium issue.

## Note Issues

### Choice of 8 decimal places

 - Likelihood: low
 - Severity: low

The token contract makes a seemingly arbitrary choice of 8 decimal places. While this is unlikely to cause significant issues, we recommend the consensus value of 18 decimal places, matching Ether and a majority of other tokens, absent any compelling reason to choose another value.

## Low Issues

### Use of `if(...) revert()` instead of `require`

 - Likelihood: medium
 - Severity: low

The `onlyAfter` modifier uses the `if(...) revert()` construction. Generally, using `require` is recommended instead, as it aids both readability and analysis by static analysis tools.

### Extending the locking period requires increasing number of locked tokens

 - Likelihood: medium
 - Severity: low

Because the only way to extend the locking period is calling `lockBalance`, and because this requires a `_value` argument greater than zero, users cannot extend the period for which their tokens are locked without also increasing the number of locked tokens.

We recommend either removing the `>0` check, or making the `_value` argument a total rather than a delta; this would have the additional benefit of making multiple calls to `lockBalance` and `unlockBalance` idempotent.

### Expired token locks must be explicitly unlocked

 - Likelihood: medium
 - Severity: low

Once a user's locked tokens have expired, they must manually call `unlockTokens` to make those tokens available for use.

We recommend removing `unlockTokens` entirely, and instead creating a `spendableBalance` property that relevant functionality depends on to determine how many tokens can be spent.

An additional benefit of resolving this and the previous issue would be to allow users with expired locks to create new locks for a smaller number of tokens in a single operation.

### `approve` function breaks ERC20

 - Likelihood: low
 - Severity: medium

The approve function throws if the caller attempts to change an approval unless either the previous approval amount or the new approval amount is zero. This is intended to prevent a known edge case with ERC20 approvals, but results in violating ERC20.

The approvals race condition does not affect other contracts, which can read and adjust approvals in a single atomic operation, and calling contracts may be unaware of this check, which violates the interface specification laid out in ERC20. As a result, these contracts may be rendered unusable with this token.

We recommend leaving out this check, and making it the responsibility of user software that issues approvals to responsibly zero them out and check them before reauthorisation.

## Medium Issues

### Callers have no way to determine when tokens become transferrable

 - Likelihood: medium
 - Severity: medium

While the `balanceLocks` mapping is publicly readable, it stores the lock date of a user's tokens, rather than the unlock date. Further, the `lockingPeriod` variable is not publicly readable. As a result, external contracts have no way to know when tokens become transferrable, except by convention (Eg, out-of-band knowledge of the contract's locking period).

We recommend either making `lockingPeriod` public, or preferably, making the `balanceLocks` date refer to the unlock date rather than the lock date.

## High Issues

None found.

## Critical Issues

None found.
wn