# 18 - Analytics

[⬅️ Back to README](./README.md)

---

Because the Moja Ride platform uses a strict double-entry ledger, generating complex financial analytics is entirely deterministic and mathematically provable.

There is no need for external data warehouses or complicated heuristic scripts to determine the platform's financial health. Everything can be derived purely from the `FinancialAccount` and `LedgerEntry` tables.

## Core Financial Metrics

### 1. Platform Liabilities (Total Escrow)
The total amount of money the platform owes to third parties at this exact millisecond.
```sql
SELECT SUM("postedBalance") 
FROM "FinancialAccount" 
WHERE "accountCategory" = 'LIABILITY'
```
*If this number exceeds the physical balance in the Moja Ride bank account, the company is technically insolvent.*

### 2. Available Operator Capital
The total amount of money that transport operators can currently withdraw.
```sql
SELECT SUM("availableBalance") 
FROM "FinancialAccount" 
WHERE "accountClass" = 'OPERATOR_RECEIVABLE'
```

### 3. Gross Merchandise Value (GMV)
The total volume of money processed by the platform over a given time period.
```sql
SELECT SUM("amount") 
FROM "LedgerEntry" 
JOIN "FinancialTransaction" ON ...
WHERE "FinancialTransaction"."type" = 'BOOKING'
AND "side" = 'DEBIT' 
AND "accountId" = (SYSTEM_CLEARING_ID)
```

### 4. Platform Net Revenue
The actual money Moja Ride keeps.
```sql
SELECT SUM("amount") 
FROM "LedgerEntry" 
JOIN "FinancialAccount" ON ...
WHERE "accountClass" IN ('PLATFORM_COMMISSION', 'PLATFORM_CONVENIENCE_FEE')
AND "side" = 'CREDIT'
```

### 5. Effective Take Rate
The percentage of the total money flowing through the platform that Moja Ride keeps as profit.
`Take Rate = Platform Net Revenue / GMV`

## Performance Considerations

Running `SUM()` queries across millions of `LedgerEntry` rows will eventually slow down the primary OLTP Postgres database.

### The Snapshot Strategy
To mitigate performance degradation, the `snapshot-accounts` cron job runs daily, weekly, and monthly. 
It captures the exact balance of every account at midnight and stores it in `FinancialAccountSnapshot`.

When an analyst wants to build a time-series graph of "Escrow Balance over the last 30 days," the backend simply queries the `FinancialAccountSnapshot` table, which is orders of magnitude smaller and requires zero `SUM()` aggregations.

### Read Replicas
For real-time dashboards that require deep joins across `Booking`, `HoldGroup`, and `LedgerEntry`, queries must be routed to a PostgreSQL Read Replica. The `AccountingEngine` strictly requires low latency to execute its `FOR UPDATE` locks, so the primary database must not be bogged down by long-running analytical queries.
