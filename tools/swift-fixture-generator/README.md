# Swift Fixture Generator

Generates a deterministic CryptoKit fixture from the native Investor package without modifying the native repository.

```bash
swift run --package-path tools/swift-fixture-generator SwiftFixtureGenerator
```

The output is committed as:

```text
tests/fixtures/crypto/aes-gcm-swift.transaction.json
```
