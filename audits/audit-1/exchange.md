# Section 1 - Table of Contents<a id="heading-0"/>

* 1 - [Table of Contents](#heading-0)
* 2 - [Table of Contents](#heading-2)
* 3 - [Introduction](#heading-3)
    * 3.1 - [Authenticity](#heading-3.1)
    * 3.2 - [Audit Goals and Focus](#heading-3.2)
        * 3.2.1 - [Smart Contract Best Practices](#heading-3.2.1)
        * 3.2.2 - [Code Correctness](#heading-3.2.2)
        * 3.2.3 - [Code Quality](#heading-3.2.3)
        * 3.2.4 - [Security](#heading-3.2.4)
        * 3.2.5 - [Testing and testability](#heading-3.2.5)
    * 3.3 - [About epoch](#heading-3.3)
    * 3.4 - [Terminology](#heading-3.4)
        * 3.4.1 - [Likelihood](#heading-3.4.1)
        * 3.4.2 - [Impact](#heading-3.4.2)
        * 3.4.3 - [Severity](#heading-3.4.3)
* 4 - [Overview](#heading-4)
    * 4.1 - [Source Code](#heading-4.1)
    * 4.2 - [General Notes](#heading-4.2)
    * 4.3 - [Contracts](#heading-4.3)
    * 4.4 - [Testing](#heading-4.4)
* 5 - [Findings](#heading-5)
    * 5.1 - [Note Issues](#heading-5.1)
        * 5.1.1 - [Use of string failure reasons](#heading-5.1.1)
        * 5.1.2 - [Filled trades leave blockchain clutter](#heading-5.1.2)
    * 5.2 - [Low Issues](#heading-5.2)
        * 5.2.1 - [Events do not use indexed parameters](#heading-5.2.1)
        * 5.2.2 - [Inconsistent use of `takerAddress` in `trade`](#heading-5.2.2)
        * 5.2.3 - [`makerAddress` parameter is redundant](#heading-5.2.3)
    * 5.3 - [Medium Issues](#heading-5.3)
        * 5.3.1 - [Use of return values instead of throwing](#heading-5.3.1)
    * 5.4 - [High Issues](#heading-5.4)
    * 5.5 - [Critical Issues](#heading-5.5)
        * 5.5.1 - [`transfer` function does not check return status of `transferFrom`](#heading-5.5.1)


# <a id="heading-2"/> Section 2 - Table of Contents

# <a id="heading-3"/> Section 3 - Introduction

On 2017-09-05, Nick Johnson performed an audit of the epoch smart
contracts. My findings are detailed below.

I, Nick Johnson have no stake or vested interest in epoch or ConsenSys. This audit
was performed under a contracted hourly rate with no other compensation.

## <a id="heading-3.1"/> 3.1 Authenticity

This document should have an attached cryptographic signature to ensure it has
not been tampered with.  The signature can be verified using the public key from
[Nick Johnson's keybase.io record](https://keybase.io/arachnid).

## <a id="heading-3.2"/> 3.2 Audit Goals and Focus

### <a id="heading-3.2.1"/> 3.2.1 Smart Contract Best Practices

This audit will evaluate whether the codebase follows the current established
best practices for smart contract development.

### <a id="heading-3.2.2"/> 3.2.2 Code Correctness

This audit will evaluate whether the code does what it is intended to do.

### <a id="heading-3.2.3"/> 3.2.3 Code Quality

This audit will evaluate whether the code has been written in a way that
ensures readability and maintainability.

### <a id="heading-3.2.4"/> 3.2.4 Security

This audit will look for any exploitable security vulnerabilities, or other
potential threats to either the operators of ChainLink or its users.

### <a id="heading-3.2.5"/> 3.2.5 Testing and testability

This audit will examine how easily tested the code is, and review how thoroughly
tested the code is.

## <a id="heading-3.3"/> 3.3 About epoch

epoch is a decentralised exchange that uses offchain signatures to authorise
swaps of tokens between independent parties. Users are divided into 'makers' and
'takers'; makers broadcepo intent to trade and sign messages authorising
trades, while takers agree to a specified trade by submitting it to the epoch
contract.

## <a id="heading-3.4"/> 3.4 Terminology

This audit uses the following terminology.

### <a id="heading-3.4.1"/> 3.4.1 Likelihood

How likely a bug is to be encountered or exploited in the wild, as specified by the
[OWASP risk rating methodology](https://www.owasp.org/index.php/OWASP_Risk_Rating_Methodology#Step_2:_Factors_for_Estimating_Likelihood).

### <a id="heading-3.4.2"/> 3.4.2 Impact

The impact a bug would have if exploited, as specified by the
[OWASP risk rating methodology](https://www.owasp.org/index.php/OWASP_Risk_Rating_Methodology#Step_3:_Factors_for_Estimating_Impact).

### <a id="heading-3.4.3"/> 3.4.3 Severity

How serious the issue is, derived from Likelihood and Impact as specified by the [OWASP risk rating methodology](https://www.owasp.org/index.php/OWASP_Risk_Rating_Methodology#Step_4:_Determining_the_Severity_of_the_Risk).

# <a id="heading-4"/> Section 4 - Overview

## <a id="heading-4.1"/> 4.1 Source Code

The epoch smart contract source code was made available in the [epoch/protocol](https://github.com/epoch/protocol/) Github repository.

The code was audited as of commit `16a1e1ea42a25b88b3dc4d66633151e9388ece7e`.

The following files were audited:
```
SHA1(./Contracts/Exchange.sol)= dbe7eb658a44386950385bf2bdd02c11275e6e4e
```

## <a id="heading-4.2"/> 4.2 General Notes

While the code is generally readable, and has well placed comments, several
changes would improve its readability and auditability significantly. Several
conditions could be better checked by modifiers, simplifying control flow, and
others should be verified using `assert` and `require` rather than if conditions
(see "use of return values instead of throwing", below).

In other cases, there is code duplication that could be removed with some
refactoring, and code such as the two distinct control flows of `transfer`
(for token and ether transfers) could be refactored into separate private
functions for readability.

## <a id="heading-4.3"/> 4.3 Contracts

`Exchange` implements the decentralised exchange functionality.

## <a id="heading-4.4"/> 4.4 Testing

A fairly complete set of unit tests is provided. Unit tests are clearly written
and easy to follow. Happy cases are tested along with most simple failures, but
some - notably invalid signatures - are not tested.

Testing requires running a separate server process. No automated build is set up
for the repository.

We recommend setting up an automated build, so new commits can be vetted against
the existing test suite.

# <a id="heading-5"/> Section 5 - Findings

We found two note issues, three low issues, one medium issue, and one critical
issue.

The critical issue can result in theft of funds from sellers, and as a result
this contract should not be used until it has been remedied.

## <a id="heading-5.1"/> 5.1 Note Issues

### <a id="heading-5.1.1"/> 5.1.1 Use of string failure reasons

 - Likelihood: low
 - Impact: low

Strings are used to describe the reason for failure, which both makes it difficult
for frontends to determine the failure reason and act appropriately, and forces
localisation to English. We recommend using an enumeration of possible error types
instead.

### <a id="heading-5.1.2"/> 5.1.2 Filled trades leave blockchain clutter

 - Likelihood: low
 - Impact: low

The use of a `fills` map, which is only ever added to, results in indelibly adding
32 bytes of storage overhead for every filled order. While there is currently
little incentive to encourage good stewardship of blockchain storage space,
consuming permanent storage for a transient event is not good practice.

## <a id="heading-5.2"/> 5.2 Low Issues

### <a id="heading-5.2.1"/> 5.2.1 Events do not use indexed parameters

 - Likelihood: medium
 - Impact: low

The `Filled`, `Canceled` and `Failed` events fail to make use of indexed parameters,
which would permit efficient lookup of records of interest to a client. We recommend
all three events add indexes on the `makerAddress`, `makerToken` and
`takerToken` parameters.

### <a id="heading-5.2.2"/> 5.2.2 Inconsistent use of `takerAddress` in `trade`

 - Likelihood: low
 - Impact: medium

The `trade` function takes an argument `takerAddress`, but restricts it to be
equal to `msg.sender` in all cases except where the source token is Ether. When
the source token is Ether, the result will be a trade paid for by a third party
in the successful case, or if `msg.value != takerAmount`, the provided funds will
be sent to the `taker` rather than back to the sender.

We recommend either eliminating the `takerAddress` argument, and substituting
`msg.sender` everywhere it is used, or if third parties paying for a trade is
desirable, modifying the general trade case such that `msg.sender` pays for the
trade in all cases, and removing the restriction that `msg.sender == takerAddress`.

### <a id="heading-5.2.3"/> 5.2.3 `makerAddress` parameter is redundant

 - Likelihood: medium
 - Impact: low

`makerAddress` is supplied to `trade` and included in the hash signed by the maker,
but is redundant, since it can be extracted using `ecrecover`. In the event that
an invalid signature is provided, an invalid `makerAddress` will be generated,
which will not have any tokens, causing the trade to fail.

Insofar as a unique hash is required for preventing replay attacks, we recommend
hashing the modified value (without `makerAddress`) together with the extracted
`makerAddress` to generate it. Alternately, the `fills` mapping can be replaced
with a nested mapping.

Further, since `validate` is always followed by setting `fills`, we recommend
making this change part of `validate`, and making it a modifier for each of the
functions that require it.

## <a id="heading-5.3"/> 5.3 Medium Issues

### <a id="heading-5.3.1"/> 5.3.1 Use of return values instead of throwing

 - Likelihood: medium
 - Impact: medium

Standard practice in smart contract development is to `throw` (typically using
`assert` or `require` as appropriate) when a failure occurs or conditions are not
met. This ensures that contracts 'fail safe' and precludes the possibility of
partial state updates occurring. After the Byzantium hard fork, throws will no
longer consume all gas, and additionally will permit returning failure information
via the `REVERT` opcode.

`Exchange` uses events to log error information and returns, rather than throwing.
As a result, other contracts calling functions such as `fill` have no way to
determine if the call succeeded, and the possibility of unintended partial updates
to state is increased. To further complicate matters, in some conditions functions
do throw, for instance if the taker is paying in ether and the recipient's fallback
function throws.

The lack of `assert`/`require` also leads to unintuitive control flow; see for
instance line 64; phrased as a `require`, this would be straightforward to reason
about, but as an `if`/`else`, the reader has to understand the entire section
in order to be sure that the failure case is handled correctly.

We strongly recommend switching to using `throw`, and adding exception information
once this is available as a language feature.

## <a id="heading-5.4"/> 5.4 High Issues

## <a id="heading-5.5"/> 5.5 Critical Issues

### <a id="heading-5.5.1"/> 5.5.1 `transfer` function does not check return status of `transferFrom`

 - Likelihood: high
 - Impact: high

The internal function `transfer` calls `transferFrom` on the specified ERC20
token, but fails to check its return value to ensure the call succeeded. Whilst
many recent tokens use `throw` instead of returning `false` when the transfer
fails, this is not required by the ERC20 standard, and many tokens do not throw.

As a result, anyone can steal tokens from a seller by simply offering to pay
with a token they do not own or have not authorised the exchange contract to
transfer.

`transfer` should be modified to either return the result of `transferFrom`, or
to `assert` it to be true.
 a