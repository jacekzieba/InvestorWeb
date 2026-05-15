import CryptoKit
import Foundation
import InvestorCore
import InvestorDomain

let fixedKey = SymmetricKey(data: Data((0..<32).map(UInt8.init)))
let fixedNonceData = Data((16..<28).map(UInt8.init))
let portfolioID = UUID(uuidString: "1A3E2E4F-C9F1-45AB-A67D-A9EF0351B5A7")!
let instrumentID = UUID(uuidString: "68295849-B3D6-4E95-95C8-F12C23F7B7B2")!
let transactionID = UUID(uuidString: "B8805A78-B5A5-4FE7-A83F-716117184D25")!
let userID = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
let timestamp = Date(timeIntervalSince1970: 1_714_694_400)

let transaction = Transaction(
    id: transactionID,
    date: timestamp,
    portfolioID: portfolioID,
    instrumentID: instrumentID,
    type: .buy,
    quantity: 3,
    price: 400,
    grossAmount: 1_200,
    currency: "PLN",
    fees: 5,
    taxes: 0,
    fxRateToBase: nil,
    notes: "Swift fixture",
    createdAt: timestamp,
    updatedAt: timestamp
)

let plaintextData = try JSONEncoder().encode(
    SyncPayloadEnvelope.transaction(TransactionPayload(transaction: transaction))
)
let plaintext = try JSONSerialization.jsonObject(with: plaintextData)
let nonce = try AES.GCM.Nonce(data: fixedNonceData)
let sealedBox = try AES.GCM.seal(plaintextData, using: fixedKey, nonce: nonce)
let encryptedPayloadBase64 = (sealedBox.ciphertext + sealedBox.tag).base64EncodedString()
let nonceBase64 = fixedNonceData.base64EncodedString()
let keyBase64 = fixedKey.withUnsafeBytes { Data($0).base64EncodedString() }

let record: [String: Any] = [
    "id": transactionID.uuidString.lowercased(),
    "user_id": userID.uuidString.lowercased(),
    "record_type": "transaction",
    "encrypted_payload": encryptedPayloadBase64,
    "nonce": nonceBase64,
    "payload_version": 1,
    "schema_version": 1,
    "device_id": "swift-fixture",
    "created_at": "2026-05-15T00:00:00.000Z",
    "updated_at": "2026-05-15T00:00:00.000Z",
    "deleted_at": NSNull()
]

let fixture: [String: Any] = [
    "description": "Swift CryptoKit AES-GCM transaction fixture using InvestorCore SyncPayloadEnvelope",
    "keyBase64": keyBase64,
    "nonceBase64": nonceBase64,
    "encryptedPayloadBase64": encryptedPayloadBase64,
    "plaintext": plaintext,
    "record": record
]

let output = try JSONSerialization.data(
    withJSONObject: fixture,
    options: [.prettyPrinted, .sortedKeys]
)
FileHandle.standardOutput.write(output)
FileHandle.standardOutput.write(Data("\n".utf8))
