# Security Specification: AlugaFácil Pro

## 1. Data Invariants
- A property cannot be published without valid owner authentication and approval by an authorized administrator.
- Owners cannot modify properties belonging to other owners.
- Unauthenticated visitors can only view properties that are approved (`moderationStatus == 'approved'`) and available (`status in ['published', 'rented']`).
- Private addresses and private phone numbers are never readable by the public.
- Charge confirmation, subscription activation, and featured duration extensions are strictly reserved for administrators. Owners can only create charge requests with `status == 'pending'`.
- All updates must preserve the original `ownerId` and `createdAt` timestamps.
- Admins are verified via existing document in `/admins/{uid}` or authenticated token matching `igorwebdesign86@gmail.com` with `email_verified == true`.

## 2. Dirty Dozen Threat Payloads Tested
1. **Self-Escalation to Admin**: Non-admin user creates `/admins/{uid}` document. -> DENIED.
2. **Shadow Field Injection**: Property payload with malicious field `__superAdmin: true`. -> DENIED.
3. **Owner Impersonation**: Attacker sets `ownerId: "victim-uid"` on property creation. -> DENIED.
4. **Self-Approval Exploit**: Owner sets `moderationStatus: "approved"` directly on property creation. -> DENIED.
5. **Bypass Payment to Self-Feature**: Owner modifies `featuredUntil` to future timestamp. -> DENIED.
6. **Hijack Another Owner's Property**: Non-owner attempts `update` on `/properties/prop123`. -> DENIED.
7. **Fake Payment Confirmation**: Owner marks their own charge `status: "confirmed"`. -> DENIED.
8. **Malicious Giant String Payload**: Title size > 150 chars or ID injection attack. -> DENIED.
9. **Email Spoofing Attack**: Attacker logs in with unverified `igorwebdesign86@gmail.com`. -> DENIED.
10. **Direct Audit Log Tampering**: Regular user attempts write to `/auditLogs/{logId}`. -> DENIED.
11. **Plan Tampering**: Regular user changes plan price from R$29,90 to R$0,00. -> DENIED.
12. **Private Address Scraping**: Visitor attempts to read private address fields directly. -> PROTECTED.
