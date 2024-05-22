## Migration

### Initial migration

```
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel \
  ./prisma/schema.prisma \
  --script \
  --output
```

1. Create migration file
   ```
   npx wrangler d1 migrations create remix-example-passkey-auth [migration name]
   ```
1. Write into migration file
   ```
   npx prisma migrate diff \
     --from-local-d1 \
     --to-schema-datamodel \
     ./prisma/schema.prisma \
     --script \
     --output \
     [newly created migration file]
   ```
