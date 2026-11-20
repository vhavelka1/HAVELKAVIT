# Hrušovanská liga – zprovoznění databáze

Veřejný přehled funguje i bez databázových tabulek jako archivní snímek. Pro zápis změn je nutné nejprve v SQL editoru správného projektu Supabase spustit `supabase/darts.sql`, potom `supabase/darts-generate.sql` a po importu také `supabase/darts-playoff.sql`. Soubor vytváří vlastní tabulky ligy s vypnutým přímým přístupem pro veřejné klienty. Server potřebuje `SUPABASE_SERVICE_ROLE_KEY`; tento klíč nikdy nepatří do klientského kódu ani do repozitáře.

Poté z kořene projektu spusťte `node scripts/import-darts.cjs`. Načte místní export do tabulek v pořadí podle jejich vazeb. Již existující řádky nepřepisuje. Hesla a resetovací tokeny z Oracle neimportuje. Skript pracuje s osobními údaji, proto se export ponechává mimo Git. Výchozí veřejný snímek obsahuje pouze jména a údaje o zápasech.

Hráčské účty jsou oddělené od administrace tohoto webu. Původní APEX hesla nejsou kompatibilní. Pro každý účet nastavte v PowerShellu ID hráče a dočasné heslo (minimálně 6 znaků), pak spusťte skript:

```powershell
$env:DARTS_PLAYER_ID = '1'
$env:DARTS_INITIAL_PASSWORD = Read-Host 'Dočasné heslo'
node scripts/set-darts-password.cjs
Remove-Item Env:DARTS_INITIAL_PASSWORD
```

Heslo bezpečně předejte příslušnému hráči; po přihlášení si jej může v profilu změnit. Při nastavování hesla skript ukončí existující relace daného hráče. Tento postup automaticky neposílá e-maily. Před ostrým použitím je třeba databázi a přihlašování otestovat včetně oprávnění a obnovy účtů.

Aktuální rozsah nepokrývá kompletní původní administraci. Generátor vytváří chybějící dvojice aktivních hráčů ve zvoleném období a nenahrazuje ruční kontrolu výsledného rozpisu. Import je jednorázový a změny provedené později v Oracle se automaticky nesynchronizují.
