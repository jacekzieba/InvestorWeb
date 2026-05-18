# Roadmap

## Etap 0 - przygotowanie repo

1. Utworzyc repo `InvestorWeb`.
2. Zainicjalizowac Next.js + TypeScript.
3. Dodac daisyUI i podstawowy theme.
4. Dodac Supabase client/server helpers.
5. Dodac Vitest i Playwright.

## Etap 1 - auth i klucz

1. Ekran logowania przez Supabase Auth - gotowe.
2. Obsluga sesji po stronie klienta - gotowe w MVP; server-side auth gate zostaje do dopiecia.
3. Pobranie `encrypted_key_backups` - gotowe.
4. Odblokowanie `userDataKey` passphrase - gotowe.
5. Test vectors zgodnosci Web Crypto z CryptoKit - gotowe.

## Etap 2 - read-only sync

1. Pobranie `encrypted_records` - gotowe dla aktywnych rekordow.
2. Odszyfrowanie payloadow w przegladarce - gotowe.
3. Walidacja Zod dla envelope - gotowe.
4. Zlozenie `InvestorDataSnapshot` - gotowe.
5. Dashboard read-only z Chart.js - gotowe.

## Etap 3 - domena web

1. Port TypeScript podstawowych modeli domenowych - gotowe dla MVP.
2. Ledger i holdings - gotowe dla podstawowych typow transakcji.
3. Wycena manualna i seria wartosci portfela - gotowe.
4. Alokacja aktywow, walut i portfeli - gotowe.
5. Testy porownujace wyniki z wersja Swift na fixtures - gotowe dla crypto; domena ma testy regresji web i wymaga dalszego rozszerzania o fixture Swift przy nowych typach transakcji.

## Etap 4 - edycja

1. CRUD portfeli - gotowe.
2. CRUD instrumentow - gotowe.
3. CRUD transakcji - gotowe.
4. Lokalny pending sync queue - gotowe z widocznym statusem, recznym retry i odrzucaniem zmian.
5. Konflikty i tombstones - gotowe: `updated_at` blokuje ciche nadpisanie, soft delete zapisuje tombstone, a UI pozwala odrzucic albo wymusic lokalna zmiane.
6. Bramka domkniecia: `npm run typecheck` i `npm test` przechodza dla warstwy domeny, sync i writerow.

## Etap 5 - import i providerzy

1. Import CSV transakcji w przegladarce - gotowe jako 5A.
2. Preview importu - gotowe jako 5A: walidacja wierszy, bledy, ostrzezenia i zapis tylko poprawnych rekordow.
3. Import XLSX w przegladarce - gotowe jako 5B.
4. UX importu: dry run, ostrzezenia, duplikaty w pliku i raport po imporcie - gotowe jako 5B.
5. Proxy providerow market data przez route handlers - gotowe jako 5C: NBP FX i Stooq EOD.
6. Cache cen i kursow - gotowe jako 5C: procesowy cache TTL bez zapisu danych portfela do Supabase.
