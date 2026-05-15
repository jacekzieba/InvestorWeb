# Crypto fixtures

InvestorWeb musi przechodzic testy zgodnosci z natywnym CryptoKit zanim zacznie czytac realny sync.

## Minimalny fixture

Kazdy fixture powinien zawierac:

```json
{
  "description": "Swift CryptoKit exported transaction envelope",
  "keyBase64": "base64 32-byte userDataKey",
  "nonceBase64": "base64 12-byte nonce",
  "encryptedPayloadBase64": "base64 ciphertext || auth_tag",
  "plaintext": {
    "recordType": "transaction",
    "id": "uuid"
  },
  "record": {
    "id": "uuid",
    "user_id": "uuid",
    "record_type": "transaction",
    "encrypted_payload": "same as encryptedPayloadBase64",
    "nonce": "same as nonceBase64",
    "payload_version": 1,
    "schema_version": 1,
    "device_id": "swift-fixture",
    "created_at": "2026-05-15T00:00:00.000Z",
    "updated_at": "2026-05-15T00:00:00.000Z",
    "deleted_at": null
  }
}
```

## Co musi sie zgadzac

- `keyBase64` po dekodowaniu ma miec 32 bajty.
- `nonceBase64` po dekodowaniu ma miec 12 bajtow.
- `encryptedPayloadBase64` to dokladnie `ciphertext || auth_tag`, bez dodatkowego envelope.
- JSON plaintextu musi odpowiadac temu, co Swift koduje przez `JSONEncoder().encode(SyncPayloadEnvelope...)`.
- Swift payload jest plaski i zawiera `recordType`; `payload_version` i `schema_version` sa metadanymi rekordu, nie polami JSON payloadu.
- `record_type` z metadanych musi zgadzac sie z `recordType` po odszyfrowaniu.
- `encrypted_key_backups` uzywa pola `encrypted_user_data_key`, a zaszyfrowana wartosc jest surowym 32-bajtowym `userDataKey`, nie JSON-em.

## Aktualne fixture

- `tests/fixtures/crypto/aes-gcm-webcrypto.example.json` jest wektorem kontrolnym wygenerowanym po stronie web.
- `tests/fixtures/crypto/aes-gcm-swift.transaction.json` jest deterministycznym wektorem wygenerowanym przez `tools/swift-fixture-generator` z natywnego `InvestorCore`.
