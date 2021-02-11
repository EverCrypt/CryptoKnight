// SPDX-License-Identifier: MIT

// Photon.sol  -- Part of the Charged Particles Protocol
// Copyright (c) 2021 Firma Lux, Inc. <https://charged.fi>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../lib/BlackholePrevention.sol";
import "../lib/RelayRecipient.sol";

// Charged Particles Membership
contract Photon is Ownable, RelayRecipient, BlackholePrevention {

  event PhotonUpdated(address indexed owner, string photonURI);
  event PhotonTransferred(address indexed oldOwner, address indexed newPhoton, string photonURI);

  mapping (address => string) private _photonURIs;


  /***********************************|
  |              Public               |
  |__________________________________*/

  function photonURI(address photon) external view returns (string memory) {
    return _photonURIs[photon];
  }

  function setPhotonURI(string calldata uri) external {
    address photon = _msgSender();
    _photonURIs[photon] = uri;
    emit PhotonUpdated(photon, uri);
  }

  function transfer(address receiver) external {
    address sender = _msgSender();
    require(bytes(_photonURIs[sender]).length > 0, "Photon:E-422");

    _photonURIs[receiver] = _photonURIs[sender];
    delete _photonURIs[sender];
    emit PhotonTransferred(sender, receiver, _photonURIs[receiver]);
  }


  /***********************************|
  |          GSN/MetaTx Relay         |
  |__________________________________*/

  /// @dev See {BaseRelayRecipient-_msgSender}.
  function _msgSender()
    internal view
    override(BaseRelayRecipient, Context)
    returns (address payable)
  {
    return BaseRelayRecipient._msgSender();
  }

  /// @dev See {BaseRelayRecipient-_msgData}.
  function _msgData()
    internal view
    override(BaseRelayRecipient, Context)
    returns (bytes memory)
  {
    return BaseRelayRecipient._msgData();
  }

  /***********************************|
  |          Only Admin/DAO           |
  |      (blackhole prevention)       |
  |__________________________________*/

  function setTrustedForwarder(address _trustedForwarder) external onlyOwner {
    trustedForwarder = _trustedForwarder;
  }

  function withdrawEther(address payable receiver, uint256 amount) external onlyOwner {
    _withdrawEther(receiver, amount);
  }

  function withdrawErc20(address payable receiver, address tokenAddress, uint256 amount) external onlyOwner {
    _withdrawERC20(receiver, tokenAddress, amount);
  }

  function withdrawERC721(address payable receiver, address tokenAddress, uint256 tokenId) external onlyOwner {
    _withdrawERC721(receiver, tokenAddress, tokenId);
  }
}