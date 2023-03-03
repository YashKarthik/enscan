# Enscan

Indexes ENS names and associated metadata in a SQL database, enabling easy querying and
filtering.

---

**Notes**:

- [X] Listen to events emitted by the registrar as every `.eth` name is regestired via that.
- [ ] Listen to `TextChanged` to keep text record in sync (use the last block indexed strategy here
    too)

- Can't index the entire chain at once / cannot start the indexing from the deploy block. Too much
time as Alchemy allows only 2K blocks per query (for unlimited logs).
- So create another table in supabase that stores the last blocknumber that was indexed.
- When cronjob starts, we check this number and start from there.


- Also, consider using Github Actions for cron instead of supabase (better syntax).
